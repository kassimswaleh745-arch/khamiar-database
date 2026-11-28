package com.khamiar.backend.service;
import com.khamiar.backend.entity.User;
import com.khamiar.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.time.Instant;
import java.security.SecureRandom;
import java.security.MessageDigest;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;
import java.util.Base64;

@Service
public class RecoveryService {
 private final UserRepository users; private final PasswordEncoder encoder; private final EmailService mail;
 @jakarta.persistence.PersistenceContext private jakarta.persistence.EntityManager em;
 private final LoginAttemptService attempts;
 @Value("${app.frontend.url:http://localhost:5173}") private String frontend;
 @Value("${app.mail.enabled:false}") private boolean enabled;
 public RecoveryService(UserRepository users, PasswordEncoder encoder, EmailService mail, LoginAttemptService attempts){this.users=users;this.encoder=encoder;this.mail=mail;this.attempts=attempts;}
 public static String token(){byte[] bytes=new byte[32];new SecureRandom().nextBytes(bytes);return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);}
 public static String hash(String value){try{return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));}catch(Exception e){throw new IllegalStateException(e);}}
 private ResponseStatusException invalid(){return new ResponseStatusException(HttpStatus.BAD_REQUEST,"Invalid or expired link");}
 private void limit(String key,String ip){if(attempts.secondsUntilAllowed(key,"recovery:"+ip)>0)throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,"Please try again later");attempts.recordFailure(key,"recovery:"+ip);}
 @Transactional public void requestReset(String email,String ip){
  limit("reset:"+email.toLowerCase(java.util.Locale.ROOT),ip);
  if(!enabled)return;
  User found=users.findByEmailIgnoreCase(email).orElse(null); if(found==null)return;
  User u=users.lockById(found.getId()).orElseThrow();em.refresh(u,jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);
  if(!u.isActive()||!u.isEmailVerified()||!email.equalsIgnoreCase(u.getEmail()))return;
  Instant now=Instant.now(); if(u.getResetExpires()!=null&&u.getResetExpires().isAfter(now.plusSeconds(240)))return;
  String t=token();u.reset(hash(t),now.plusSeconds(300));
  mail.send(u.getEmail(),"KHAMIAR password reset", "Reset your password within 5 minutes: "+frontend+"/reset-password#"+t+"\nIgnore this message if you did not request it.");
 }
 @Transactional public void requestVerification(String username,String password,String ip){
  limit("verify:"+username,ip);
  User found=users.findByUsernameIgnoreCase(username).orElseThrow();User u=users.lockById(found.getId()).orElseThrow();em.refresh(u,jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);
  if(!u.isActive()||!encoder.matches(password,u.getPassword()))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Current password is incorrect");
  if(!enabled||u.getEmail()==null)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Email delivery or account email is unavailable");
  if(u.isEmailVerified())return;
  Instant now=Instant.now();if(u.getVerificationExpires()!=null&&u.getVerificationExpires().isAfter(now.plusSeconds(540)))return;
  String t=token();u.verification(hash(t),now.plusSeconds(600));
  mail.send(u.getEmail(),"KHAMIAR email verification","Verify your email within 10 minutes: "+frontend+"/verify-email#"+t);
 }
 @Transactional public void verify(String token){String h=hash(token);User found=users.findByVerificationHash(h).orElseThrow(this::invalid);User u=users.lockById(found.getId()).orElseThrow(this::invalid);em.refresh(u,jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);if(!u.isActive()||!h.equals(u.getVerificationHash())||u.getVerificationExpires()==null||!u.getVerificationExpires().isAfter(Instant.now()))throw invalid();u.setEmailVerified(true);u.verification(null,null);}
 @Transactional public void reset(String token,String password){String h=hash(token);User found=users.findByResetHash(h).orElseThrow(this::invalid);User u=users.lockById(found.getId()).orElseThrow(this::invalid);em.refresh(u,jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);if(!u.isActive()||!u.isEmailVerified()||!h.equals(u.getResetHash())||u.getResetExpires()==null||!u.getResetExpires().isAfter(Instant.now()))throw invalid();if(password.length()<8||password.getBytes(StandardCharsets.UTF_8).length>72||!password.matches("(?s).*[A-Za-z].*")||!password.matches("(?s).*\\d.*"))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Use 8 or more characters, a letter and a number, maximum 72 bytes");u.setPassword(encoder.encode(password));u.revokeSessions();}
}
