package com.sophie.aac.analytics.repository;

import com.sophie.aac.analytics.domain.WellbeingEntryEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface WellbeingEntryRepository extends JpaRepository<WellbeingEntryEntity, UUID> {

    List<WellbeingEntryEntity> findByCreatedAtAfter(Instant since);
}

