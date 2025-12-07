package com.nos.backend_api.services.user;

import java.text.ParseException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.JWSObject;
import com.nimbusds.jose.JWSVerifier;
import com.nimbusds.jose.Payload;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import com.nos.backend_api.DTO.data.enums.OtpType;
import com.nos.backend_api.DTO.data.enums.SendEmailType;
import com.nos.backend_api.DTO.data.enums.UserRole;
import com.nos.backend_api.DTO.request.RequestDto.ForgotPasswordRequest;
import com.nos.backend_api.DTO.request.RequestDto.IntrospectRequest;
import com.nos.backend_api.DTO.request.RequestDto.LoginRequest;
import com.nos.backend_api.DTO.request.RequestDto.OtpData;
import com.nos.backend_api.DTO.request.RequestDto.OtpValidationRequest;
import com.nos.backend_api.DTO.request.RequestDto.RefreshTokenRequest;
import com.nos.backend_api.DTO.request.RequestDto.RegisterRequest;
import com.nos.backend_api.DTO.request.RequestDto.ResetPasswordRequest;
import com.nos.backend_api.DTO.response.ApiResponse;
import com.nos.backend_api.DTO.response.ResponseDto;
import com.nos.backend_api.DTO.response.ResponseDto.AuthResponse;
import com.nos.backend_api.DTO.response.ResponseDto.IntrospectResponse;
import com.nos.backend_api.exceptions.AppException;
import com.nos.backend_api.exceptions.ErrorCode;
import com.nos.backend_api.models.auth.InvalidatedToken;
import com.nos.backend_api.models.auth.RefreshToken;
import com.nos.backend_api.models.user_info.Account;
import com.nos.backend_api.models.user_info.Wallet;
import com.nos.backend_api.repositories.AccountRepository;
import com.nos.backend_api.repositories.InvalidatedTokenRepository;
import com.nos.backend_api.repositories.RefreshTokenRepository;
import com.nos.backend_api.repositories.WalletRepository;
import com.nos.backend_api.services._system.NotificationProducer;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final AccountRepository accountRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final InvalidatedTokenRepository invalidatedTokenRepository;
    private final NotificationProducer notificationProducer;
    private final WalletRepository walletRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    @Value("${jwt.signer-key}")
    private String SIGNER_KEY;

    private final Long ACCESS_TOKEN_DURATION = ChronoUnit.HOURS.getDuration().toMillis();  // 1h
    private final Long REFRESH_TOKEN_DURATION = ChronoUnit.DAYS.getDuration().toMillis() * 7;  // 7 days
    private final Long OTP_EXPIRY = 5 * 60 * 1000L;  // 5 min

    private PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(10);

    // POST /auth/login
    @Transactional
    public ApiResponse<AuthResponse> login(LoginRequest request) {
        Optional<Account> optAccount = accountRepository.findByEmail(request.getEmail());
        if (optAccount.isEmpty() || !passwordEncoder.matches(request.getPassword(), optAccount.get().getPassword())) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        Account user = optAccount.get();

        if (!user.isActive()) {
            generateOtp(request.getEmail(), OtpType.REGISTER);
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        } 

        String accessToken = generateAccessToken(user);
        String refreshToken = generateRefreshToken(user);
        return ApiResponse.success(AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(ACCESS_TOKEN_DURATION / 1000)
                .user(ResponseDto.UserResponse.builder()
                        .id(user.getId())
                        .email(user.getEmail())
                        .fullName(user.getFullName())
                        .role(user.getRole())
                        .active(user.isActive())
                        .dateOfBirth(user.getDateOfBirth())
                        .build())
                .build());
    }

    // POST /auth/register
    @Transactional
    public ApiResponse<AuthResponse> register(RegisterRequest request) {
        if (accountRepository.existsByEmail(request.getEmail())) {
            throw new AppException(ErrorCode.USER_EXISTED);
        }
        Account account = Account.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .dateOfBirth(request.getDateOfBirth())
                .role(UserRole.USER)
                .active(false)
                .build();
        account = accountRepository.save(account);
        Wallet wallet = Wallet.builder()
            .user(account)
            .balance(java.math.BigDecimal.ZERO)
            .isActive(true)
            .pinHash(null)
            .build();
        walletRepository.save(wallet);
        account.setWallet(wallet);
        account = accountRepository.save(account);
        // Send OTP via email
        generateOtp(request.getEmail(), OtpType.REGISTER);
        Map<String, Object> welcomeData = Map.of(
        "userName", request.getFullName(),
        "email", request.getEmail()
        );
        notificationProducer.sendNotification(new NotificationProducer.EmailMessage(request.getEmail(), SendEmailType.WELCOME, welcomeData));
        // Return without token, require OTP validate
        return ApiResponse.success(null, "User registered, OTP sent");
    }

    // POST /auth/refresh-token
    @Transactional
    public ApiResponse<AuthResponse> refreshToken(RefreshTokenRequest request) {
        Optional<RefreshToken> optRefresh = refreshTokenRepository.findById(request.getRefreshToken());
        if (optRefresh.isEmpty() || optRefresh.get().getExpiryDate().isBefore(Instant.now()) || !optRefresh.get().isActive()) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        Account user = optRefresh.get().getUser();
        String newAccessToken = generateAccessToken(user);
        String newRefreshToken = generateRefreshToken(user);
        refreshTokenRepository.delete(optRefresh.get());
        // Rotate refresh or keep
        return ApiResponse.success(AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .tokenType("Bearer")
                .expiresIn(ACCESS_TOKEN_DURATION / 1000)
                .user(ResponseDto.UserResponse.builder().id(user.getId()).build())
                .build());
    }

    // POST /auth/logout
    @Transactional
    public ApiResponse<Void> logout(String token) throws JOSEException, ParseException {
        SignedJWT signedJWT = verifyToken(token);
        String jit = signedJWT.getJWTClaimsSet().getJWTID();
        Date expiry = signedJWT.getJWTClaimsSet().getExpirationTime();
        invalidatedTokenRepository.save(InvalidatedToken.builder()
                .tokenId(jit)
                .expiryTime(expiry.toInstant())
                .build());
        // Optional: revoke refresh if provided
        return ApiResponse.success(null, "Logged out");
    }

    // POST /auth/generate-otp
    @Transactional(readOnly = true)
    public ApiResponse<Void> generateOtp(String email, OtpType type) {
        String code = String.valueOf((int) (Math.random() * 900000) + 100000);  // 6 digit
        String key = "otp:" + email + ":" + type;

        OtpData otpData = new OtpData(code, type.name());

        redisTemplate.opsForValue().set(key, otpData, OTP_EXPIRY, java.util.concurrent.TimeUnit.MILLISECONDS);
        // Send via Resend
        Map<String, Object> otpDataEmail = Map.of(
        "otp", code,
        "type", type.name().toLowerCase(),
        "expiry", "5 minutes"
        );
        notificationProducer.sendNotification(new NotificationProducer.EmailMessage(email, SendEmailType.OTP, otpDataEmail));
        return ApiResponse.success(null, "OTP sent");
    }

    // POST /auth/validate-otp
    @Transactional
    public ApiResponse<Void> validateOtp(OtpValidationRequest request) {
        String key = "otp:" + request.getEmail() + ":" + request.getType();  // Assume type
        OtpData otpData = (OtpData) redisTemplate.opsForValue().get(key);
        if (otpData == null || !otpData.getCode().equals(request.getCode())) {
            throw new AppException(ErrorCode.INVALID_KEY);
        }
        redisTemplate.delete(key);  // Invalidate
        if (request.getType().equals(OtpType.REGISTER)) {
            System.out.println("Activating user account for " + request.getEmail());
            Optional<Account> optAccount = accountRepository.findByEmail(request.getEmail());
            Account user = optAccount.get();
            user.setActive(true);
            accountRepository.save(user);
        }
        return ApiResponse.success(null, "OTP valid");
    }

    // POST /auth/forgot-password
    @Transactional(readOnly = true)
    public ApiResponse<Void> forgotPassword(ForgotPasswordRequest request) {
        if (!accountRepository.existsByEmail(request.getEmail())) {
            throw new AppException(ErrorCode.USER_NOT_EXISTED);
        }
        generateOtp(request.getEmail(), OtpType.FORGOT_PASSWORD);
        return ApiResponse.success(null, "OTP for reset sent");
    }

    // POST /auth/reset-password
    @Transactional
    public ApiResponse<Void> resetPassword(ResetPasswordRequest request) {
        Optional<Account> optAccount = accountRepository.findByEmail(request.getEmail());
        if (optAccount.isPresent()) {
            Account account = optAccount.get();
            account.setPassword(passwordEncoder.encode(request.getNewPassword()));
            accountRepository.save(account);
        }
        return ApiResponse.success(null, "Password reset");
    }

    // POST /auth/introspect (internal)
    public IntrospectResponse introspect(IntrospectRequest request) throws JOSEException, ParseException {
        try {
            verifyToken(request.getToken());
            return IntrospectResponse.builder().valid(true).build();
        } catch (AppException e) {
            return IntrospectResponse.builder().valid(false).build();
        }
    }

    // Private methods
    private String generateAccessToken(Account user) {
        try {
            JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                    .issuer("https://nos.com")
                    .issueTime(new Date())
                    .jwtID(UUID.randomUUID().toString())
                    .subject(user.getId().toString())
                    .expirationTime(new Date(Instant.now().plusMillis(ACCESS_TOKEN_DURATION).toEpochMilli()))
                    .claim("role", user.getRole().name())
                    .claim("email", user.getEmail())
                    .build();
            JWSHeader header = new JWSHeader.Builder(JWSAlgorithm.HS256).build();
            JWSObject jwsObject = new JWSObject(header, new Payload(claimsSet.toJSONObject()));
            jwsObject.sign(new MACSigner(SIGNER_KEY.getBytes()));
            return jwsObject.serialize();
        } catch (JOSEException e) {
            throw new AppException(ErrorCode.TOKEN_GENERATION_FAILED);
        }
    }

    @Transactional
    private String generateRefreshToken(Account user) {
        return refreshTokenRepository.save(RefreshToken.builder()
                .refreshToken(UUID.randomUUID().toString())
                .user(user)
                .expiryDate(Instant.now().plusMillis(REFRESH_TOKEN_DURATION))
                .active(true)
                .build()).getRefreshToken();
    }

    private SignedJWT verifyToken(String token) throws JOSEException, ParseException {
        SignedJWT signedJWT = SignedJWT.parse(token);
        JWSVerifier verifier = new MACVerifier(SIGNER_KEY.getBytes());
        if (!signedJWT.verify(verifier)) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        if (signedJWT.getJWTClaimsSet().getExpirationTime().before(new Date())) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        if (invalidatedTokenRepository.existsById(signedJWT.getJWTClaimsSet().getJWTID())) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        return signedJWT;
    }
}