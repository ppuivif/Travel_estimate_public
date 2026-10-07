package fr.travelestimate.catalog;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/catalog")
public class CatalogController {
    private final CatalogRepository catalog;
    public CatalogController(CatalogRepository catalog) { this.catalog = catalog; }

    public record CatalogRequest(@NotBlank String serviceType, @NotBlank String name, String subtype,
        String location, @NotBlank String unit, @NotNull @DecimalMin("0.00") BigDecimal unitCost) {}
    public record CatalogView(Long id, String serviceType, String name, String subtype,
        String location, String unit, BigDecimal unitCost) {}

    @GetMapping
    @Transactional(readOnly = true)
    public List<CatalogView> list() {
        return catalog.findAllByOrderByServiceTypeAscNameAsc().stream().map(this::view).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public CatalogView create(@Valid @RequestBody CatalogRequest request) {
        CatalogService item = catalog.save(new CatalogService(request.serviceType(), request.name(),
            request.subtype(), request.location(), request.unit(), request.unitCost()));
        return view(item);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        if (!catalog.existsById(id)) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Prestation introuvable");
        catalog.deleteById(id);
    }

    private CatalogView view(CatalogService item) {
        return new CatalogView(item.getId(), item.getServiceType(), item.getName(), item.getSubtype(),
            item.getLocation(), item.getUnit(), item.getUnitCost());
    }
}
