package com.nos.backend_api.models.user_info;

import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import com.nos.backend_api.models.AbstractEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "addresses", indexes = {
        @jakarta.persistence.Index(name = "idx_addresses_user_id", columnList = "user_id") })
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Address extends AbstractEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, foreignKey = @ForeignKey(name = "fk_addresses_users", foreignKeyDefinition = "FOREIGN KEY (user_id) REFERENCES accounts(id)"))
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Account user;

    @NotBlank
    @Column(name = "recipient_full_name", nullable = false)
    private String recipientFullName;

    @NotBlank
    @Column(name = "recipient_phone", nullable = false)
    private String recipientPhone;

    @NotBlank
    @Column(name = "district", nullable = false)
    private String district;

    @NotBlank
    @Column(name = "city", nullable = false)
    private String city;

    @NotBlank
    @Column(name = "country", nullable = false)
    private String country;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    @Column(name = "note")
    private String note;

    @Column(name = "is_default", nullable = false)
    @Builder.Default
    private boolean isDefault = false;
}