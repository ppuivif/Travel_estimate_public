package fr.travelestimate.clients;

import fr.travelestimate.quotes.QuoteRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/clients")
public class ClientController {
    private final ClientRepository clients;
    private final QuoteRepository quotes;
    public ClientController(ClientRepository clients, QuoteRepository quotes) {
        this.clients = clients;
        this.quotes = quotes;
    }

    public record ClientRequest(@NotBlank String lastName, @NotBlank String firstName,
                                String address, String email, String phone) {}
    public record ClientView(Long id, String lastName, String firstName, String address,
                             String email, String phone) {}

    @GetMapping
    @Transactional(readOnly = true)
    public List<ClientView> list() {
        return clients.findAllByOrderByLastNameAscFirstNameAsc().stream().map(this::view).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public ClientView create(@Valid @RequestBody ClientRequest request) {
        Client client = clients.save(new Client(request.lastName(), request.firstName(), request.address(),
            request.email(), request.phone()));
        return view(client);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void delete(@PathVariable Long id) {
        Client client = clients.findById(id).orElseThrow(() ->
            new ResponseStatusException(HttpStatus.NOT_FOUND, "Client introuvable"));
        if (quotes.existsByClient_Id(id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ce client est associé à un devis");
        }
        clients.delete(client);
    }

    private ClientView view(Client client) {
        return new ClientView(client.getId(), client.getLastName(), client.getFirstName(),
            client.getAddress(), client.getEmail(), client.getPhone());
    }
}
