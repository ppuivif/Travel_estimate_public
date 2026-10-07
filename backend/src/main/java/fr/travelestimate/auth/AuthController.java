package fr.travelestimate.auth;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Value("${APP_USERNAME}")
    private String appUsername;

    @Value("${APP_PASSWORD}")
    private String appPassword;

    public record LoginRequest(String username, String password) {}
    public record LoginResponse(String username) {}

    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest request) {
        if (!appUsername.equals(request.username()) || !appPassword.equals(request.password())) {
            throw new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Authentification invalide"
            );
        }

        return new LoginResponse(request.username());
    }
}