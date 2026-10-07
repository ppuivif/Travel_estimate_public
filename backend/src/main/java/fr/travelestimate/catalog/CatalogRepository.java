package fr.travelestimate.catalog;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CatalogRepository extends JpaRepository<CatalogService, Long> {
    List<CatalogService> findAllByOrderByServiceTypeAscNameAsc();
}
