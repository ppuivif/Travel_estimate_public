package fr.travelestimate.quotes;

import org.springframework.data.jpa.repository.JpaRepository;

public interface QuoteRepository extends JpaRepository<Quote, Long> {
    boolean existsByClient_Id(Long clientId);
}
