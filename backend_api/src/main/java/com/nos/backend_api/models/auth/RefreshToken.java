package com.nos.backend_api.models.auth;

import java.time.Instant;

import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import com.nos.backend_api.models.AbstractEntity;
import com.nos.backend_api.models.user_info.Account;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "refresh_tokens")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RefreshToken extends AbstractEntity {
    @Id
    @Column(name = "refresh_token", nullable = false)
    private String refreshToken;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, foreignKey = 
        @ForeignKey(name = "fk_refresh_tokens_users", foreignKeyDefinition = "FOREIGN KEY (user_id) REFERENCES accounts(id)")
    )
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Account user;

    @Column(name = "expiry_date", nullable = false)
    private Instant expiryDate;

    @Builder.Default
    @Column(name = "active", nullable = false)
    private boolean active = true;
}
