package com.sophie.aac.analytics.repository;

import com.sophie.aac.analytics.domain.InteractionEventEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface InteractionEventRepository extends JpaRepository<InteractionEventEntity, UUID> {

    List<InteractionEventEntity> findByCreatedAtAfter(Instant since);
}

