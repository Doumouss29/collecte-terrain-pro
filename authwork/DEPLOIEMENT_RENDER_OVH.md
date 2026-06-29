# Déploiement Collecte Terrain Pro — Render + PostgreSQL OVH

## Architecture

- Application React/Vite + API Node/Express : Render Web Service
- Base PostgreSQL : instance OVH existante
- Base dédiée recommandée : `collecte_terrain_pro`

## 1. Créer la base dédiée sur OVH

Depuis Windows CMD :

```cmd
createdb -h postgresql-d1be9bc3-oe2bccb52.database.cloud.ovh.net -p 20184 -U avnadmin "collecte_terrain_pro"
```

Si `createdb` est refusé, connectez-vous à `defaultdb` puis exécutez :

```sql
CREATE DATABASE collecte_terrain_pro;
```

## 2. Initialiser le schéma

```cmd
psql "postgresql://avnadmin:MOT_DE_PASSE@postgresql-d1be9bc3-oe2bccb52.database.cloud.ovh.net:20184/collecte_terrain_pro?sslmode=require" -f backend/schema.sql
```

## 3. GitHub

Ne jamais envoyer `.env` sur GitHub. Le `.gitignore` l'exclut déjà.

```cmd
git init
git add .
git commit -m "Externalisation Collecte Terrain Pro"
git branch -M main
git remote add origin https://github.com/VOTRE_COMPTE/collecte-terrain-pro.git
git push -u origin main
```

## 4. Créer le Web Service Render

- Language : Node
- Branch : main
- Root Directory : vide
- Build Command : `npm install --include=dev && npm run build`
- Start Command : `npm start`
- Instance : Free

## 5. Variables Render

```env
NODE_ENV=production
DATABASE_SSL=true
DATABASE_URL=postgresql://avnadmin:MOT_DE_PASSE@postgresql-d1be9bc3-oe2bccb52.database.cloud.ovh.net:20184/collecte_terrain_pro?sslmode=require
PUBLIC_BASE_URL=https://VOTRE-SERVICE.onrender.com
APP_URL=https://VOTRE-SERVICE.onrender.com
CORS_ORIGIN=https://VOTRE-SERVICE.onrender.com
DEV_USER_EMAIL=admin@local.test
DEV_USER_NAME=Administrateur Collecte
DEV_USER_FIRST_NAME=Administrateur
DEV_USER_LAST_NAME=Collecte
DEV_USER_ROLE=admin
NPM_CONFIG_PRODUCTION=false
```

## 6. Vérifications

- Santé : `https://VOTRE-SERVICE.onrender.com/health`
- Utilisateur : `https://VOTRE-SERVICE.onrender.com/api/auth/me`
- Application : `https://VOTRE-SERVICE.onrender.com`

## Limites connues

- L'authentification actuelle est un compte administrateur automatique. Ce n'est pas encore une authentification multi-utilisateurs sécurisée.
- L'invitation par email est simulée tant qu'aucun SMTP n'est configuré.
- Les fichiers envoyés dans `/uploads` sont éphémères sur Render Free. Pour une production durable, utiliser OVH Object Storage, S3 ou Cloudinary.
- Les règles RLS Base44 ne sont pas reproduites côté serveur dans cette version. Il faut ajouter des contrôles d'autorisation avant une production multi-utilisateurs.
