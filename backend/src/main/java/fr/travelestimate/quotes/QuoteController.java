package fr.travelestimate.quotes;

import fr.travelestimate.clients.Client;
import fr.travelestimate.clients.ClientRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/quotes")
public class QuoteController {
    private final QuoteRepository quotes;
    private final ClientRepository clients;
    private final QuoteDocumentService documents;
    public QuoteController(QuoteRepository quotes, ClientRepository clients, QuoteDocumentService documents) { this.quotes = quotes; this.clients = clients; this.documents = documents; }

    public record LineRequest(@NotBlank String description, String period,
        @NotBlank String unit, @NotNull @DecimalMin("0.00") BigDecimal unitCost,
        @NotNull @DecimalMin(value="0.001") BigDecimal quantity) {}
    public record CreateQuoteRequest(@NotNull Long clientId, LocalDate quoteDate,
        @NotNull @DecimalMin(value="0.0001") BigDecimal salesCoefficient,
        boolean validated, @NotEmpty List<@Valid LineRequest> lines) {}
    public record LineView(String description, String period, String unit, BigDecimal unitCost,
        BigDecimal quantity, BigDecimal totalCost) {}
    public record QuoteView(Long id, Long clientId, LocalDate quoteDate, String clientLastName, String clientFirstName,
        String clientAddress, String clientEmail, String clientPhone, BigDecimal salesCoefficient,
        boolean validated, List<LineView> lines, BigDecimal totalCost, BigDecimal totalPrice) {}

    @GetMapping
    @Transactional(readOnly = true)
    public List<QuoteView> list() { return quotes.findAll().stream().map(this::view).toList(); }

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public QuoteView get(@PathVariable Long id) { return view(find(id)); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public QuoteView create(@Valid @RequestBody CreateQuoteRequest request) {
        Client client = clients.findById(request.clientId()).orElseThrow(() ->
            new ResponseStatusException(HttpStatus.NOT_FOUND, "Client introuvable"));
        Quote quote = new Quote(request.quoteDate(), client, request.salesCoefficient(), request.validated());
        for (LineRequest line : request.lines()) {
            quote.addLine(new QuoteLine(line.description().trim(), line.period(), line.unit().trim(),
                line.unitCost(), line.quantity()));
        }
        return view(quotes.save(quote));
    }

    @PostMapping("/{id}/document")
    @Transactional
    public ResponseEntity<ByteArrayResource> generateDocument(@PathVariable Long id) {
        Quote quote = find(id);
        quote.validate();
        byte[] document = documents.generate(quote);
        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType("application/vnd.oasis.opendocument.text"))
            .header(HttpHeaders.CONTENT_DISPOSITION,
                ContentDisposition.attachment().filename("devis-" + id + ".odt").build().toString())
            .body(new ByteArrayResource(document));
    }

    private Quote find(Long id) {
        return quotes.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Devis introuvable"));
    }

    private QuoteView view(Quote quote) {
        List<LineView> lines = quote.getLines().stream().map(line -> new LineView(line.getDescription(),
            line.getPeriod(), line.getUnit(), money(line.getUnitCost()), line.getQuantity(),
            money(line.getUnitCost().multiply(line.getQuantity())))).toList();
        BigDecimal total = lines.stream().map(LineView::totalCost).reduce(BigDecimal.ZERO, BigDecimal::add);
        total = money(total);
        return new QuoteView(quote.getId(), quote.getClient() == null ? null : quote.getClient().getId(),
            quote.getQuoteDate(), quote.getClientLastName(), quote.getClientFirstName(),
            quote.getClientAddress(), quote.getClientEmail(), quote.getClientPhone(), quote.getSalesCoefficient(),
            quote.isValidated(), lines, total, money(total.multiply(quote.getSalesCoefficient())));
    }
    private BigDecimal money(BigDecimal value) { return value.setScale(2, RoundingMode.HALF_UP); }
}
