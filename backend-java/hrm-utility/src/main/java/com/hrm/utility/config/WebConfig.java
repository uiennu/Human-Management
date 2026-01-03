package com.hrm.utility.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**") // 1. Cho phép tất cả các API
                .allowedOrigins("http://localhost:3000") // 2. Chỉ cho phép React gọi vào
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS") // 3. Các method được phép
                .allowedHeaders("*") // 4. Cho phép mọi header (như Authorization...)
                .allowCredentials(true); // 5. Cho phép gửi kèm cookies/credentials nếu cần
    }
}