# Version complète avec invitations par lien

Cette version ne nécessite aucun SMTP.

## Fonctionnement

1. L'administrateur saisit l'email et le rôle.
2. Le backend crée une invitation sécurisée valable 7 jours.
3. Le lien est copié automatiquement dans le presse-papiers.
4. L'administrateur envoie ce lien par Gmail, WhatsApp ou SMS.
5. L'utilisateur ouvre le lien, choisit son mot de passe et crée son compte.

## Variables Render à vérifier

```env
APP_URL=https://collecte-terrain-pro.onrender.com
PUBLIC_BASE_URL=https://collecte-terrain-pro.onrender.com
INVITATION_TTL_DAYS=7
```

## Déploiement

Depuis le dossier du projet :

```cmd
npm install
npm run build
git add .
git commit -m "Add secure invitation links"
git push
```

Render redéploiera automatiquement.

## Remplacement du projet

Le ZIP contient tout le projet. Vous pouvez remplacer le contenu de votre projet actuel,
mais conservez le dossier caché `.git` de votre dépôt local.
