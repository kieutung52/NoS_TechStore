package com.nos.backend_api.services._system;

import java.util.HashMap;
import java.util.Map;

import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nos.backend_api.DTO.data.enums.SendEmailType;
import com.nos.backend_api.configuration.RabbitConfig;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationProducer {
    private final RabbitTemplate rabbitTemplate;
    private final ObjectMapper objectMapper;

    public void sendNotification(EmailMessage message) {
        try {
            String jsonMessage = objectMapper.writeValueAsString(message);
            rabbitTemplate.convertAndSend(RabbitConfig.EXCHANGE_NAME, RabbitConfig.NOTIFICATION_ROUTING_KEY, jsonMessage);
            log.info("Notification message sent to queue for email: {} and type: {}", message.getEmail(), message.getType());
        } catch (Exception e) {
            log.error("Failed to send notification message", e);
        }
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EmailMessage {
        private String email;
        private SendEmailType type;
        private Map<String, Object> data = new HashMap<>();
    }
}