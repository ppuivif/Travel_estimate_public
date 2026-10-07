# Travel Estimate

Application de création et de gestion de devis de voyage.

## Objectifs du projet

Au-delà de la création d'une application fonctionnelle, l'objectif principal de ce projet est d'élaborer et de tester une chaîne de conception à partir d'un besoin exprimé par un utilisateur.<br>

## Démarche de conception

Cette chaîne de conception comprend plusieurs étapes :
1. Analyse et conception fonctionnelle
   - Analyse du besoin
   - Définition des exigences
   - Analyse fonctionnelle
   - Description des spécifications

2. Conception technique
   - Définition de l'architecture
   - Description des composants
   - Définition du modèle de données
   - Définition des interfaces
   - Conception détaillée
L'exploitation de cette chaîne de conception doit permettre d'obtenir une description détaillée de l'état souhaité du système.<br>
Cet état cible doit être suffisamment précis pour servir de référence au développement et aux tests. 
L'évolution du produit déclenche un nouveau cycle de conception : analyse du besoin, définition du nouvel état cible, implémentation et validation par les tests.

## Technologies

- Frontend : Angular (application standalone)
- API : Java 21, Spring Boot, Maven
- Base de données : MariaDB

## Démarrage

Pour tester l'application en local :
- démarrer MariaDB avec `docker compose up -d`,
- démarrer l’API avec `cd backend && mvn spring-boot:run`,
- dans un autre terminal, démarrer Angular avec `cd frontend && npm start`.<br>
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
