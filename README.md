# Optique Mazagan — Caisse & clients

Application Next.js (App Router) pour un opticien au Maroc : **clients**, **caisse** (créances / encaissements), **stock montures**, **tableau de bord**, **notifications** paramétrables (cron Vercel) et **rôles** admin / employé.

Base de données : **Turso** (LibSQL) via Drizzle ORM.

## Prérequis

- Node.js 20+
- Compte [Turso](https://turso.tech) et base créée

## Configuration locale

1. Copier `.env.example` vers `.env.local` et renseigner :

   - `TURSO_DATABASE_URL` — URL `libsql://...`
   - `TURSO_AUTH_TOKEN` — jeton Turso (**ne jamais commiter** ; régénérez-le s’il a fuité)
   - `AUTH_SECRET` — par ex. `openssl rand -base64 32`
   - `CRON_SECRET` — secret pour sécuriser l’URL cron en production (Vercel)

2. Installer les dépendances et pousser le schéma :

   ```bash
   npm install
   npm run db:push
   ```

3. Créer les comptes initiaux et les règles de notification par défaut :

   ```bash
   set SEED_ADMIN_PASSWORD=votre_mot_de_passe_admin
   set SEED_WORKER_PASSWORD=votre_mot_de_passe_employe
   npm run seed
   ```

   (Sous PowerShell les variables persistent pour la session ; vous pouvez aussi les mettre dans `.env.local` et adapter `scripts/seed.ts` si besoin.)

4. Lancer le serveur de développement :

   ```bash
   npm run dev
   ```

Connexion par défaut si vous n’avez pas surchargé les emails dans le seed : `admin@optique.local` / `employe@optique.local`.

## Import depuis Access (`.accdb`)

Exportez la table clients en **CSV** depuis Access, puis :

```bash
npm run import:clients -- "C:\chemin\vers\clients.csv"
```

Ajustez les en-têtes pour correspondre aux colonnes documentées dans `scripts/import-clients-csv.ts`.

## Déploiement Vercel

1. Projet GitHub connecté à Vercel.
2. **Variables d’environnement** (Production, et Preview si besoin) : comme `.env.example` — au minimum `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, **`AUTH_SECRET`** (obligatoire pour les sessions), `CRON_SECRET` (pour le cron).
   - **Noms exacts** : `TURSO_DATABASE_URL` et `TURSO_AUTH_TOKEN` (souvent la cause de `url: undefined` si le nom diffère ou si la variable n’existe que pour un autre environnement).
   - **Variables « Sensitive » sur Vercel** : elles peuvent être **exclues de l’étape de build**. Comme `npm run vercel-build` lance `drizzle-kit push` pendant le build, ces deux variables doivent être visibles au build. Soit vous ne les marquez pas comme Sensitive, soit vous mettez la commande de build sur `npm run build` et vous exécutez **`npm run db:push`** une fois en local avec les identifiants de prod.
3. **Commande de build** : dans Vercel → Projet → **Settings** → **General** → **Build & Development Settings**, remplacez la commande de build par :
   ```bash
   npm run vercel-build
   ```
   Ce script vérifie la présence de Turso, exécute `drizzle-kit push` puis `next build`. Si un message d’erreur détaillé s’affiche, suivez les indications (variables manquantes ou réservées au runtime).
4. **Une seule fois après le premier déploiement réussi** : créez les comptes initiaux depuis une machine de confiance, avec les **mêmes** variables Turso que sur Vercel (ou `vercel env pull`) :
   ```bash
   set SEED_ADMIN_PASSWORD=...
   set SEED_WORKER_PASSWORD=...
   npm run seed
   ```
   Ne lancez pas `seed` à chaque déploiement.
5. Le cron défini dans `vercel.json` appelle `GET /api/cron/notifications` avec `Authorization: Bearer <CRON_SECRET>` (comportement Vercel Cron).

En local, `npm run build` suffit pour vérifier l’application ; `npm run vercel-build` nécessite un accès réseau à Turso (comme sur Vercel).

## WhatsApp (phase 2)

Les clés `WHATSAPP_*` dans `.env.example` sont optionnelles. Le module `src/lib/notifications/whatsapp.ts` est un point d’extension : branchez l’API Meta Cloud, Twilio, etc., sans stocker de secrets en base.

## Logo

Ajoutez votre fichier `upscalemedia-transformed (1).png` sous `public/brand/logo.png` et remplacez dans `src/components/app-shell.tsx` la source `img` par `/brand/logo.png` si vous préférez le PNG au SVG fourni.

## Rôles

| Zone | Admin | Employé |
|------|-------|---------|
| Clients, caisse, stock | oui | oui |
| Suppression client / ligne caisse / ligne stock | oui | non |
| Utilisateurs & règles d’alertes | oui | non |
| Métriques « encaissements mois » & impayés (dashboard) | oui | partiel |

## Licence

Usage interne — Abdo Optique Mazagan.
