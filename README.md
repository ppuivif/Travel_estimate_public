# Travel Estimate

Application de création et de gestion de devis de voyage.

## Technologies

- Frontend : Angular (application standalone)
- API : Java 21, Spring Boot, Maven
- Base de données : MariaDB

## Démarrage

Pour tester l'application en local :
- démarrer MariaDB avec `docker compose up -d`,
- démarrer l’API avec `cd backend && mvn spring-boot:run`,
- dans un autre terminal, démarrer Angular avec `cd frontend && npm start`.
L’interface est alors disponible sur `http://localhost:4200`.

## Authentification

L’authentification est limitée au compte de développement `test` / `test`.<br>
Ce mécanisme n’est pas destiné à une mise en production.

## Usage

L'application permet de gérer la base clients et le catalogue des prestations.<br>
Elle permet de créer un devis avec un client et des prestations.<br>
Depuis la fiche, le bouton de validation génère et télécharge le devis au format ODT à partir du modèle `Modèle de devis.odt`.

## Structure

- `frontend/` contient l’interface Angular,
- `backend/` l’API REST Spring Boot,
- `compose.yaml` le service MariaDB.
