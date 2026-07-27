# WORM ERROR // 404

Plateforme SaaS — une IA pensée pour les développeurs (génération de projets, correction de bugs, chat, gestion des utilisateurs, plan Premium par clé d'activation).

## Stack technique

| Côté | Techs |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend | Node.js, Express, TypeScript, Socket.IO |
| Base de données | PostgreSQL + Prisma ORM |
| Cache / rate-limit | Redis |
| Auth | JWT (access + refresh), bcrypt |
| Déploiement | Docker + docker-compose |

## Structure du projet

```
worm-error-404/
├── backend/            → API REST + WebSocket (Express, Prisma, Socket.IO)
│   ├── src/
│   │   ├── config/      → variables d'environnement, connexion DB/Redis
│   │   ├── middleware/   → auth JWT, limite des 15 messages gratuits, rôle admin
│   │   ├── routes/       → auth, chat, premium, admin, user
│   │   ├── controllers/  → logique métier de chaque route
│   │   ├── services/     → aiService.ts (branchement futur de l'API IA + recherche temps réel)
│   │   ├── socket/       → chat temps réel Socket.IO
│   │   └── utils/        → JWT, hash, génération de clés
│   ├── prisma/schema.prisma → modèle de données
│   └── Dockerfile
├── frontend/            → Next.js (landing, chat, premium, à propos, admin, auth)
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## Ce qui est fonctionnel dans ce scaffold

- Authentification complète (inscription / connexion / JWT + refresh token, hash bcrypt).
- Compteur de 15 messages gratuits par utilisateur, avec blocage automatique et modal Premium.
- Déblocage Premium par saisie d'une clé d'activation (génération/validation de clés côté admin).
- Chat en temps réel (Socket.IO) avec historique des conversations en base.
- `aiService.ts` : point d'intégration unique où brancher ta clé API IA + outils de recherche temps réel (actuellement un stub qui répond, à remplacer par ton prompt système + ta clé API quand tu les fourniras).
- Upload de fichiers (images, captures, ZIP) côté chat, stockés et attachés au message.
- Dashboard admin : utilisateurs, statistiques, clés Premium, conversations, paramètres du site, clés API.
- Landing page, page "À propos" (texte CID), boutons WhatsApp / Telegram, page Premium.
- Docker Compose : Postgres, Redis, backend, frontend prêts à lancer en une commande.

## Lancer le projet en local

### 1. Prérequis
- Node.js 20+
- Docker + Docker Compose

### 2. Configuration
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```
Renseigne dans `backend/.env` : `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, et plus tard `AI_API_KEY` + `AI_SYSTEM_PROMPT` quand tu les auras.

### 3. Lancer avec Docker (recommandé)
```bash
docker-compose up --build
```
- Frontend : http://localhost:3000
- Backend API : http://localhost:4000
- Postgres : localhost:5432
- Redis : localhost:6379

Au premier lancement, exécute les migrations Prisma :
```bash
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend npx prisma db seed
```

### 4. Lancer sans Docker (dev manuel)
```bash
# Backend
cd backend
npm install
npx prisma migrate dev
npm run dev

# Frontend (autre terminal)
cd frontend
npm install
npm run dev
```

## Créer un compte admin

Le seed (`backend/prisma/seed.ts`) crée un compte admin par défaut :
- email : `admin@wormerror404.dev`
- mot de passe : `ChangeMe123!`

**Change ce mot de passe dès le premier déploiement.**

## Brancher ton IA plus tard

Un seul fichier à éditer : `backend/src/services/aiService.ts`.
Tu y ajoutes ta clé API (`AI_API_KEY` dans `.env`) et ton prompt système (`AI_SYSTEM_PROMPT`). Le reste de la plateforme (limite de messages, historique, upload de fichiers, Premium) fonctionne déjà autour de ce point d'entrée.

## Déploiement en production

1. Provisionne un serveur (VPS) avec Docker installé.
2. Copie le dossier du projet sur le serveur.
3. Renseigne les variables `.env` de production (secrets JWT différents, `DATABASE_URL` de prod, `NODE_ENV=production`).
4. `docker-compose -f docker-compose.yml up -d --build`
5. Mets un reverse proxy (Nginx / Caddy) devant les ports 3000 et 4000 avec certificat HTTPS (Let's Encrypt).
6. Configure les sauvegardes automatiques de la base Postgres.

## Notes de sécurité importantes

- Change tous les secrets par défaut (`JWT_SECRET`, `JWT_REFRESH_SECRET`, mot de passe admin) avant toute mise en ligne publique.
- Les clés Premium sont à usage unique et hashées en base ; ne les stocke jamais en clair ailleurs que dans ton propre registre de distribution.
- Le endpoint `AI_API_KEY` ne doit jamais être exposé côté frontend : tout appel IA passe par le backend.
