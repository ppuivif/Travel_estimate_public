package fr.travelestimate.catalog;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "service_catalog")
public class CatalogService {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, length = 120)
    private String serviceType;
    @Column(nullable = false, length = 180)
    private String name;
    @Column(length = 180)
    private String subtype;
    @Column(length = 240)
    private String location;
    @Column(nullable = false, length = 60)
    private String unit;
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal unitCost;

    protected CatalogService() {}
    public CatalogService(String serviceType, String name, String subtype, String location, String unit, BigDecimal unitCost) {
        this.serviceType = serviceType.trim();
        this.name = name.trim();
        this.subtype = subtype == null || subtype.isBlank() ? null : subtype.trim();
        this.location = location == null || location.isBlank() ? null : location.trim();
        this.unit = unit.trim();
        this.unitCost = unitCost;
    }
    public Long getId() { return id; }
    public String getServiceType() { return serviceType; }
    public String getName() { return name; }
    public String getSubtype() { return subtype; }
    public String getLocation() { return location; }
    public String getUnit() { return unit; }
    public BigDecimal getUnitCost() { return unitCost; }
}
