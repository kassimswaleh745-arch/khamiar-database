package com.khamiar.backend.service;

import com.google.i18n.phonenumbers.NumberParseException;
import com.google.i18n.phonenumbers.PhoneNumberUtil;
import com.google.i18n.phonenumbers.Phonenumber.PhoneNumber;
import org.springframework.stereotype.Service;

@Service
public class PhoneNumberService {

    private static final String DEFAULT_REGION = "TZ";

    private final PhoneNumberUtil phoneUtil =
            PhoneNumberUtil.getInstance();

    public String normalize(String rawPhone) {

        if (rawPhone == null || rawPhone.isBlank()) {
            throw new IllegalArgumentException(
                    "Phone number is required."
            );
        }

        try {
            PhoneNumber phoneNumber = phoneUtil.parse(
                    rawPhone.trim(),
                    DEFAULT_REGION
            );

            if (!phoneUtil.isValidNumber(phoneNumber)
                    || phoneNumber.hasExtension()) {
                throw new IllegalArgumentException(
                        "Please enter a valid phone number."
                );
            }

            return phoneUtil.format(
                    phoneNumber,
                    PhoneNumberUtil.PhoneNumberFormat.E164
            );

        } catch (NumberParseException ex) {
            throw new IllegalArgumentException(
                    "Invalid phone number format."
            );
        }
    }

    public boolean isValid(String rawPhone) {
        try {
            normalize(rawPhone);
            return true;
        } catch (IllegalArgumentException ex) {
            return false;
        }
    }
}
