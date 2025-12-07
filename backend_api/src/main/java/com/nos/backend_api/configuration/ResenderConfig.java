package com.nos.backend_api.configuration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.resend.Resend;

@Configuration
public class ResenderConfig {
    @Value("${resend.api_key}")
    private String apikey;

    @Bean
    public Resend resend() {
        return new Resend(apikey);
    }
}
