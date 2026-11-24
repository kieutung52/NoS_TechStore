package com.nos.backend_api.configuration;

import java.time.Duration;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.CacheControl;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import com.nos.backend_api.services._system.LocalStorageService;

import lombok.RequiredArgsConstructor;

/** Phục vụ ảnh đã lưu local tại /uploads/** (chỉ bật khi app.storage.provider=local). */
@Configuration
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.storage.provider", havingValue = "local", matchIfMissing = true)
public class LocalStorageWebConfig implements WebMvcConfigurer {

    private final LocalStorageService localStorageService;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String location = localStorageService.getRootDir().toUri().toString();
        if (!location.endsWith("/")) {
            location += "/";
        }
        registry.addResourceHandler(LocalStorageService.URL_PREFIX + "/**")
                .addResourceLocations(location)
                .setCacheControl(CacheControl.maxAge(Duration.ofDays(7)).cachePublic());
    }
}
