package fr.travelestimate.quotes;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "quote_lines")
public class QuoteLine {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "quote_id", nullable = false)
    private Quote quote;
    @Column(nullable = false, length = 240)
    private String description;
    @Column(length = 240)
    private String period;
    @Column(nullable = false, length = 60)
    private String unit;
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal unitCost;
    @Column(nullable = false, precision = 12, scale = 3)
    private BigDecimal quantity;

    protected QuoteLine() {}
    public QuoteLine(String description, String period, String unit, BigDecimal unitCost, BigDecimal quantity) {
        this.description = description;
        this.period = period;
        this.unit = unit;
        this.unitCost = unitCost;
        this.quantity = quantity;
    }
    void setQuote(Quote quote) { this.quote = quote; }
    public String getDescription() { return description; }
    public String getPeriod() { return period; }
    public String getUnit() { return unit; }
    public BigDecimal getUnitCost() { return unitCost; }
    public BigDecimal getQuantity() { return quantity; }
}
