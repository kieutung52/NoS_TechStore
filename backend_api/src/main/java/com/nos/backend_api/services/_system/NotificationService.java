package com.nos.backend_api.services._system;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nos.backend_api.DTO.data.enums.SendEmailType;
import com.nos.backend_api.configuration.RabbitConfig;
import com.resend.Resend;
import com.resend.core.exception.ResendException;
import com.resend.services.emails.model.CreateEmailOptions;
import com.resend.services.emails.model.CreateEmailResponse;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class NotificationService {
    private final Map<SendEmailType, EmailTemplate> emailTemplates;
    private final Resend resend;
    private final ObjectMapper objectMapper;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EmailTemplate {
        private String subject;
        private String content;
    }

    @SneakyThrows(IOException.class)
    public NotificationService(Resend resend,
                           @Value("${app.email.from:Test App <onboarding@resend.dev>}") String fromEmail,
                           @Value("classpath:email_templates/welcome.txt") Resource welcomeTemplate,
                           @Value("classpath:email_templates/otp.txt") Resource otpTemplate,
                           @Value("classpath:email_templates/password_reset.txt") Resource resetPasswordTemplate,
                           @Value("classpath:email_templates/notification.txt") Resource generalNotificationTemplate,
                           @Value("classpath:email_templates/order_success.txt") Resource orderSuccessTemplate,
                           @Value("classpath:email_templates/order_cancelled.txt") Resource orderCancelledTemplate,
                           @Value("classpath:email_templates/order_shipped.txt") Resource orderShippedTemplate,
                           @Value("classpath:email_templates/order_delivered.txt") Resource orderDeliveredTemplate,
                           @Value("classpath:email_templates/transaction_notification.txt") Resource transactionTemplate) {
        this.resend = resend;
        this.objectMapper = new ObjectMapper();
        this.emailTemplates = Map.of(
            SendEmailType.WELCOME, new EmailTemplate(
                    "Welcome to NoS TechStore!",
                    new String(welcomeTemplate.getInputStream().readAllBytes(), StandardCharsets.UTF_8)
            ),
            SendEmailType.OTP, new EmailTemplate(
                    "Your OTP Code",
                    new String(otpTemplate.getInputStream().readAllBytes(), StandardCharsets.UTF_8)
            ),
            SendEmailType.PASSWORD_RESET, new EmailTemplate(
                    "Password Reset Request",
                    new String(resetPasswordTemplate.getInputStream().readAllBytes(), StandardCharsets.UTF_8)
            ),
            SendEmailType.NOTIFICATION, new EmailTemplate(
                    "Notification from NoS TechStore",
                    new String(generalNotificationTemplate.getInputStream().readAllBytes(), StandardCharsets.UTF_8)
            ),
            SendEmailType.ORDER_SUCCESS, new EmailTemplate(
                    "Order Placed Successfully!",
                    new String(orderSuccessTemplate.getInputStream().readAllBytes(), StandardCharsets.UTF_8)
            ),
            SendEmailType.ORDER_CANCELLED, new EmailTemplate(
                    "Order Cancelled",
                    new String(orderCancelledTemplate.getInputStream().readAllBytes(), StandardCharsets.UTF_8)
            ),
            SendEmailType.ORDER_SHIPPED, new EmailTemplate(
                    "Order Shipped",
                    new String(orderShippedTemplate.getInputStream().readAllBytes(), StandardCharsets.UTF_8)
            ),
            SendEmailType.TRANSACTION_NOTIFICATION, new EmailTemplate(
                    "Transaction Update",
                    new String(transactionTemplate.getInputStream().readAllBytes(), StandardCharsets.UTF_8)
            ),
            SendEmailType.ORDER_DELIVERED, new EmailTemplate(
                    "Order Delivered",
                    new String(orderDeliveredTemplate.getInputStream().readAllBytes(), StandardCharsets.UTF_8)
            )
        );
    }

    @RabbitListener(queues = RabbitConfig.NOTIFICATION_QUEUE)
    public void handleNotification(String messageJson) {
        try {
            NotificationProducer.EmailMessage message = objectMapper.readValue(messageJson, NotificationProducer.EmailMessage.class);
            sendEmail(message);
        } catch (Exception e) {
            log.error("Failed to process notification message: {}", messageJson, e);
            // Dead letter queue or retry can be added here for stability
        }
    }

    private void sendEmail(NotificationProducer.EmailMessage msg) {
        EmailTemplate template = emailTemplates.get(msg.getType());
        if (template == null) {
            log.warn("No template found for type: {}", msg.getType());
            return;
        }

        String subject = replacePlaceholders(template.getSubject(), msg.getData());
        String content = replacePlaceholders(template.getContent(), msg.getData());

        // using test email for development
        CreateEmailOptions params = CreateEmailOptions.builder()
                .from("onboarding@resend.dev")
                .to("kieuthanhtung0502@gmail.com")
                .subject(subject)
                .text(content)
                .build();

        try {
            CreateEmailResponse response = resend.emails().send(params);
            log.info("Email sent successfully for type: {} to: {}", msg.getType(), msg.getEmail());
            log.info(response.toString());
        } catch (ResendException e) {
            log.error("Failed to send email to {}: {}", msg.getEmail(), e.getMessage());
        }
    }

    private String replacePlaceholders(String text, Map<String, Object> data) {
        if (!StringUtils.hasText(text)) {
            return text;
        }
        for (Map.Entry<String, Object> entry : data.entrySet()) {
            String placeholder = "{" + entry.getKey() + "}";
            text = text.replace(placeholder, String.valueOf(entry.getValue()));
        }
        return text;
    }
}