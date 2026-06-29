# Intégration du lien d'invitation

## Fichiers fournis

- `backend/server.js` : remplace le fichier existant.
- `src/pages/AcceptInvitation.jsx` : nouveau fichier.
- `src/lib/invitationClient.js` : nouveau fichier.

## Modification minimale dans `src/App.jsx`

Ajoutez l'import :

```jsx
import AcceptInvitation from '@/pages/AcceptInvitation';
```

Puis, tout au début du composant `App`, avant la vérification d'authentification :

```jsx
const isInvitationPage =
  window.location.pathname === '/accept-invitation';

if (isInvitationPage) {
  return <AcceptInvitation />;
}
```

## Modification de la page qui invite un membre

Importez :

```jsx
import {
  createInvitation,
  copyInvitationLink,
} from '@/lib/invitationClient';
```

Dans le gestionnaire du bouton d'invitation :

```jsx
const result = await createInvitation({
  email,
  role,
  organisationId: organisation.id,
});

await copyInvitationLink(result.invitation_url);

alert(
  "Invitation créée. Le lien a été copié. Envoyez-le par Gmail, WhatsApp ou SMS."
);
```

Pour afficher le lien directement dans l'écran :

```jsx
const [invitationUrl, setInvitationUrl] = useState('');

const result = await createInvitation({
  email,
  role,
  organisationId: organisation.id,
});

setInvitationUrl(result.invitation_url);
```

Puis dans le JSX :

```jsx
{invitationUrl && (
  <div className="mt-4 rounded-lg border p-3">
    <p className="text-sm font-medium">Lien d'invitation</p>
    <input
      readOnly
      value={invitationUrl}
      className="mt-2 w-full rounded border px-3 py-2"
    />
    <button
      type="button"
      onClick={() => copyInvitationLink(invitationUrl)}
      className="mt-2 rounded bg-blue-800 px-3 py-2 text-white"
    >
      Copier le lien
    </button>
  </div>
)}
```

## Variables Render

Vérifiez :

```env
APP_URL=https://collecte-terrain-pro.onrender.com
PUBLIC_BASE_URL=https://collecte-terrain-pro.onrender.com
INVITATION_TTL_DAYS=7
```

## Déploiement

```cmd
npm run build
git add .
git commit -m "Add manual invitation links"
git push
```

Après déploiement, l'administrateur crée une invitation, copie le lien et l'envoie manuellement.
