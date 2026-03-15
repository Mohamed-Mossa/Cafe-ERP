package com.cafe.erp.crm.application.command;
import jakarta.validation.constraints.*; import lombok.Data;
@Data public class CreateCustomerRequest {
    @NotBlank @Pattern(regexp = "^\\+?[0-9]{10,15}$") private String phone;
    @NotBlank private String fullName;
    private String email;
}
