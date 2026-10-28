package com.khamiar.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/**
 * Sends email after the database transaction commits, so a rejected save never sends a message.
 * While mail is not configured, the message is only written to the backend log (dry-run mode).
 * A mail failure never breaks the request that triggered it.
 */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final ObjectProvider<JavaMailSender> sender;
    private final boolean enabled;
    private final String from;

    public EmailService(ObjectProvider<JavaMailSender> sender,
                        @Value("${app.mail.enabled:false}") boolean enabled,
                        @Value("${app.mail.from:no-reply@localhost}") String from) {
        this.sender = sender;
        this.enabled = enabled;
        this.from = from;
    }

    public void send(String to, String subject, String body) {
        if (to == null || to.isBlank()) {
            return;
        }
        Runnable job = () -> deliver(to.trim(), subject, body);
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    job.run();
                }
            });
        } else {
            job.run();
        }
    }

    private void deliver(String to, String subject, String body) {
        JavaMailSender mailSender = sender.getIfAvailable();
        if (!enabled || mailSender == null) {
            log.info("[EMAIL NOT SENT: mail is not configured] to={} | subject={}\n{}", to, subject, body);
            return;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(from);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            log.info("[EMAIL SENT] to={} | subject={}", to, subject);
        } catch (Exception e) {
            log.warn("[EMAIL FAILED] to={} | subject={} | {}", to, subject, e.getMessage());
        }
    }
}
