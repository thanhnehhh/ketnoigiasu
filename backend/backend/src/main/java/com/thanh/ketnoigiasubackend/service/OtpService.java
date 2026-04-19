package com.thanh.ketnoigiasubackend.service;

import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OtpService {

    private final Map<String, OtpData> otpStorage = new ConcurrentHashMap<>();

    public String generateOtp(String email) {
        String otp = String.format("%06d", new SecureRandom().nextInt(1000000));

        OtpData otpData = new OtpData(otp, LocalDateTime.now().plusMinutes(5)); // Hết hạn sau 5 phút
        otpStorage.put(email, otpData);

        return otp;
    }

    public boolean verifyOtp(String email, String otp) {
        OtpData data = otpStorage.get(email);

        if (data == null) {
            return false;
        }

        if (LocalDateTime.now().isAfter(data.expiryTime)) {
            otpStorage.remove(email);
            return false;
        }

        boolean isValid = data.otp.equals(otp);

        if (isValid) {
            otpStorage.remove(email);
        }

        return isValid;
    }

    private static class OtpData {
        String otp;
        LocalDateTime expiryTime;

        OtpData(String otp, LocalDateTime expiryTime) {
            this.otp = otp;
            this.expiryTime = expiryTime;
        }
    }
}