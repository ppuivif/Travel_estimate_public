package fr.travelestimate.clients;

import jakarta.persistence.*;

@Entity
@Table(name = "clients")
public class Client {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, length = 120)
    private String lastName;
    @Column(nullable = false, length = 120)
    private String firstName;
    @Column(length = 500)
    private String address;
    @Column(length = 254)
    private String email;
    @Column(length = 40)
    private String phone;

    protected Client() {}
    public Client(String lastName, String firstName, String address, String email, String phone) {
        this.lastName = lastName.trim();
        this.firstName = firstName.trim();
        this.address = address;
        this.email = email;
        this.phone = phone;
    }
    public Long getId() { return id; }
    public String getLastName() { return lastName; }
    public String getFirstName() { return firstName; }
    public String getAddress() { return address; }
    public String getEmail() { return email; }
    public String getPhone() { return phone; }
}
