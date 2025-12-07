package com.nos.backend_api.models.auth;

import java.time.Instant;

import com.nos.backend_api.models.AbstractEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "invalidated_tokens")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvalidatedToken extends AbstractEntity {
    @Id
    @Column(name = "token_id", nullable = false)
    private String tokenId;

    @Column(name = "expiry_time", nullable = false)
    private Instant expiryTime;
}
