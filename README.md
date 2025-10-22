# PolluTrack Front

Application Angular pour le TP03 « Intégration d’un Service de Gestion des Pollutions ».  
Elle consomme une API mockée afin de proposer un CRUD complet sur les pollutions avec filtres, vue liste, détail et formulaire d’édition.

## Prérequis

- Node.js 18+ (la CLI signale que la v23 n’est pas supportée en production)
- npm 9+

## Installation

```bash
cd Front
npm install
```

> ⚠️ L’installation nécessite un accès au registry npm.

## Démarrage du frontend

```bash
npm start
```

Puis ouvrez `http://localhost:4200/`.

## Configuration API

Les URLs d’API sont centralisées dans `src/environments` :

- `environment.ts` → `http://localhost:3000/api`
- `environment.production.ts` → URL à remplacer par le backend déployé (ex. Render)

## Fonctionnalités clés

- Liste des pollutions avec filtres combinables (nom, ville, type, statut, niveaux).
- Actions rapides : consultation, édition, suppression.
- Page de détail présentant les métadonnées du signalement.
- Formulaire Angular (Reactive Forms) pour créer ou modifier une pollution.
- Service `PollutionService` basé sur `HttpClient` et signaux Angular pour partager l’état.
- Gestion rudimentaire des erreurs et feedback utilisateur.

## Lancer les tests

```bash
npm test
```

