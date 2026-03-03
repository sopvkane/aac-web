package com.sophie.aac.auth.security;

import com.sophie.aac.auth.repository.AuthSessionRepository;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {

  @Bean
  public SecurityFilterChain securityFilterChain(HttpSecurity http, AuthSessionRepository sessions) throws Exception {
    http
        .csrf(csrf -> csrf.disable())
        .cors(Customizer.withDefaults())
        .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .addFilterBefore(new CookieSessionAuthFilter(sessions), UsernamePasswordAuthenticationFilter.class)
        .authorizeHttpRequests(auth -> auth
            // public endpoints
            .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
            .requestMatchers(HttpMethod.POST, "/api/auth/logout").permitAll()
            .requestMatchers("/actuator/health", "/actuator/info").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/health/**").permitAll()
            // caregiver profile is restricted to caregiver-style roles
            .requestMatchers("/api/carer/**").hasAnyRole("PARENT", "CARER")
            // everything else can stay open for now
            .anyRequest().permitAll()
        )
        .exceptionHandling(ex -> ex
            // For this app we treat missing/invalid auth on protected endpoints as 403
            .authenticationEntryPoint((request, response, authException) ->
                response.sendError(HttpStatus.FORBIDDEN.value()))
        );

    return http.build();
  }
}