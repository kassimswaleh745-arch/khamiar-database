package com.khamiar.backend.repository;
import com.khamiar.backend.entity.AuthSession;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import java.time.Instant;
public interface AuthSessionRepository extends JpaRepository<AuthSession,String>{
 @Lock(LockModeType.PESSIMISTIC_WRITE) @Query("select s from AuthSession s where s.hash=:hash") Optional<AuthSession> lock(@Param("hash") String hash);
 @Modifying @Query("delete from AuthSession s where s.expires < :now") void purge(@Param("now") Instant now);
}
