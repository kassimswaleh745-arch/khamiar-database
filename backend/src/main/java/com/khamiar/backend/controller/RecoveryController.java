package com.khamiar.backend.controller;
import com.khamiar.backend.service.RecoveryService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
@RestController @RequestMapping("/api/auth")
public class RecoveryController {
 private final RecoveryService service;
 public RecoveryController(RecoveryService service){this.service=service;}
 record Email(@NotBlank @jakarta.validation.constraints.Email @Size(max=150) String email){}
 record Token(@NotBlank @Pattern(regexp="[A-Za-z0-9_-]{43}") String token){}
 record Reset(@NotBlank @Pattern(regexp="[A-Za-z0-9_-]{43}") String token,@NotBlank @Size(max=72) String password){}
 record Password(@NotBlank @Size(max=100) String password){}
 @PostMapping("/forgot-password") public Map<String,String> forgot(@Valid @RequestBody Email body,HttpServletRequest req){service.requestReset(body.email().trim(),req.getRemoteAddr());return Map.of("message","If an eligible verified account exists, a reset link will be sent.");}
 @PostMapping("/reset-password") public void reset(@Valid @RequestBody Reset body){service.reset(body.token(),body.password());}
 @PostMapping("/verify-email") public void verify(@Valid @RequestBody Token body){service.verify(body.token());}
 @PostMapping("/request-verification") public void request(@Valid @RequestBody Password body,Authentication auth,HttpServletRequest req){service.requestVerification(auth.getName(),body.password(),req.getRemoteAddr());}
}
