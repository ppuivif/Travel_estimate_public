package fr.travelestimate.quotes;

import jakarta.persistence.*;
import fr.travelestimate.clients.Client;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "quotes")
public class Quote {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDate quoteDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id")
    private Client client;

    @Column(nullable = false, length = 120)
    private String clientLastName;
    @Column(nullable = false, length = 120)
    private String clientFirstName;
    @Column(length = 500)
    private String clientAddress;
    @Column(length = 254)
    private String clientEmail;
    @Column(length = 40)
    private String clientPhone;

    @Column(nullable = false, precision = 10, scale = 4)
    private BigDecimal salesCoefficient;

    @Column(nullable = false)
    private boolean validated;

    @OneToMany(mappedBy = "quote", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderColumn(name = "line_order")
    private List<QuoteLine> lines = new ArrayList<>();

    protected Quote() {}

    public Quote(LocalDate quoteDate, Client client, BigDecimal salesCoefficient, boolean validated) {
        this.quoteDate = quoteDate == null ? LocalDate.now() : quoteDate;
        this.client = client;
        this.clientLastName = client.getLastName();
        this.clientFirstName = client.getFirstName();
        this.clientAddress = client.getAddress();
        this.clientEmail = client.getEmail();
        this.clientPhone = client.getPhone();
        this.salesCoefficient = salesCoefficient;
        this.validated = validated;
    }

    public void addLine(QuoteLine line) { lines.add(line); line.setQuote(this); }
    public Long getId() { return id; }
    public LocalDate getQuoteDate() { return quoteDate; }
    public Client getClient() { return client; }
    public String getClientLastName() { return clientLastName; }
    public String getClientFirstName() { return clientFirstName; }
    public String getClientAddress() { return clientAddress; }
    public String getClientEmail() { return clientEmail; }
    public String getClientPhone() { return clientPhone; }
    public BigDecimal getSalesCoefficient() { return salesCoefficient; }
    public boolean isValidated() { return validated; }
    public void validate() { this.validated = true; }
    public List<QuoteLine> getLines() { return lines; }
}
