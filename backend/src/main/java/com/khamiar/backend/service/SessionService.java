package com.khamiar.backend.service;
import com.khamiar.backend.entity.*;
import com.khamiar.backend.repository.*;
import com.khamiar.backend.dto.LoginResponse;
import jakarta.servlet.http.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.time.*;
@Service
public class SessionService {
 private final AuthSessionRepository sessions;private final UserRepository users;private final TokenService tokens;private final SystemService system;
 @Value("${app.frontend.url:http://localhost:5173}") private String origin;
 @Value("${app.auth.secure-cookie:true}") private boolean secure;
 public SessionService(AuthSessionRepository sessions,UserRepository users,TokenService tokens,SystemService system){this.sessions=sessions;this.users=users;this.tokens=tokens;this.system=system;}
 public void checkOrigin(HttpServletRequest req){if(!origin.equals(req.getHeader("Origin")))throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Untrusted origin");}
 private String cookie(HttpServletRequest req){if(req.getCookies()!=null)for(Cookie c:req.getCookies())if(c.getName().equals("khamiar_refresh"))return c.getValue();return null;}
 private void setCookie(HttpServletResponse res,String value,boolean remember,Instant expires){var builder=ResponseCookie.from("khamiar_refresh",value).httpOnly(true).secure(secure).sameSite("Strict").path("/api/auth");if(value.isEmpty())builder.maxAge(0);else if(remember)builder.maxAge(Duration.between(Instant.now(),expires));res.addHeader("Set-Cookie",builder.build().toString());res.setHeader("Cache-Control","no-store");}
 private void issue(User user,boolean remember,Instant expires,HttpServletResponse res){String raw=RecoveryService.token();AuthSession s=new AuthSession();s.hash=RecoveryService.hash(raw);s.userId=user.getId();s.tokenVersion=user.getTokenVersion();s.expires=expires;s.remember=remember;sessions.save(s);setCookie(res,raw,remember,expires);}
 @Transactional public void start(User user,boolean remember,HttpServletRequest req,HttpServletResponse res){if(req.getHeader("Origin")==null)return;checkOrigin(req);sessions.purge(Instant.now());String old=cookie(req);if(old!=null)sessions.lock(RecoveryService.hash(old)).ifPresent(sessions::delete);issue(user,remember,Instant.now().plus(remember?Duration.ofDays(7):Duration.ofHours(8)),res);}
 @Transactional public LoginResponse refresh(HttpServletRequest req,HttpServletResponse res){checkOrigin(req);String raw=cookie(req);if(raw==null)throw denied();AuthSession s=sessions.lock(RecoveryService.hash(raw)).orElseThrow(this::denied);User u=users.findById(s.userId).orElseThrow(this::denied);if(!s.expires.isAfter(Instant.now())||!u.isActive()||u.getTokenVersion()!=s.tokenVersion||(u.getRole()==Role.EMPLOYEE&&system.isLocked()))throw denied();sessions.delete(s);issue(u,s.remember,s.expires,res);return new LoginResponse(tokens.generate(u),u.getUsername(),u.getRole().name(),tokens.getExpiryMinutes());}
 @Transactional public void end(HttpServletRequest req,HttpServletResponse res){checkOrigin(req);String raw=cookie(req);if(raw!=null)sessions.lock(RecoveryService.hash(raw)).ifPresent(sessions::delete);setCookie(res,"",false,Instant.now());}
 private ResponseStatusException denied(){return new ResponseStatusException(HttpStatus.UNAUTHORIZED,"Session expired. Sign in again.");}
}
