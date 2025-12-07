package com.nos.backend_api.configuration;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.ExchangeBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitConfig {

    public static final String EXCHANGE_NAME = "techStoreExchange";

    public static final String NOTIFICATION_QUEUE = "notificationQueue";
    public static final String NOTIFICATION_ROUTING_KEY = "notification.#";

    @Bean
    public TopicExchange techStoreExchange() {
        return ExchangeBuilder.topicExchange(EXCHANGE_NAME).durable(true).build();
    }

    @Bean
    public Queue notificationQueue() {
        return new Queue(NOTIFICATION_QUEUE, true);
    }

    @Bean
    public Binding notificationBinding(Queue notificationQueue, TopicExchange techStoreExchange) {
        return BindingBuilder.bind(notificationQueue)
                .to(techStoreExchange)
                .with(NOTIFICATION_ROUTING_KEY);
    }
}
