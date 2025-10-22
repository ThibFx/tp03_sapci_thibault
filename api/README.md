# PolluTrack Mock API

Backend simulé (sans base de données) pour le TP03.  
Il expose un CRUD REST en mémoire sur `/api/pollutions`.

## Démarrage

```bash
cd api
npm install   # aucun package externe requis, la commande peut être ignorée
npm start
```

Le serveur écoute sur `http://localhost:3000`.

## Routes disponibles

- `GET /api/pollutions` – Liste des pollutions, avec filtres `search`, `type`, `city`, `status`, `minLevel`, `maxLevel`.
- `GET /api/pollutions/:id` – Détail d’une pollution.
- `POST /api/pollutions` – Création (tous les champs obligatoires).
- `PUT /api/pollutions/:id` – Mise à jour.
- `DELETE /api/pollutions/:id` – Suppression.

Les données sont maintenues en mémoire : chaque redémarrage réinitialise l’état.

