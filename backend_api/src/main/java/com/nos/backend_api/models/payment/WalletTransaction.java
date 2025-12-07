package com.nos.backend_api.models.payment;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import com.nos.backend_api.DTO.data.enums.TransactionStatus;
import com.nos.backend_api.DTO.data.enums.TransactionType;
import com.nos.backend_api.models.AbstractEntity;
import com.nos.backend_api.models.user_info.Wallet;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "wallet_transactions", indexes = {
        @jakarta.persistence.Index(name = "idx_wallet_transactions_wallet_id", columnList = "wallet_id"),
        @jakarta.persistence.Index(name = "idx_wallet_transactions_date", columnList = "transaction_date")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WalletTransaction extends AbstractEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false)
    private UUID id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "wallet_id", nullable = false, foreignKey = @ForeignKey(name = "fk_wallet_transactions_wallets", foreignKeyDefinition = "FOREIGN KEY (wallet_id) REFERENCES wallets(id)"))
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Wallet wallet;

    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", nullable = false)
    private TransactionType transactionType; // Enum: DEPOSIT, WITHDRAWAL, PURCHASE, REFUND

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_status", nullable = false)
    private TransactionStatus transactionStatus = TransactionStatus.PENDING; // Enum: PENDING, COMPLETED, FAILED

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", foreignKey = @ForeignKey(name = "fk_wallet_transactions_orders", foreignKeyDefinition = "FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL"))
    private Order order;

    @Builder.Default
    @Column(name = "transaction_date", nullable = false)
    private LocalDateTime transactionDate = LocalDateTime.now();

    @NotBlank
    @Column(name = "description", nullable = false)
    private String description;

    @Column(name = "amount", precision = 19, scale = 2, nullable = false)
    private BigDecimal amount;
}