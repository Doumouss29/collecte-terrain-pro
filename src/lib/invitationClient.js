export async function createInvitation({
  email,
  role = 'agent',
  organisationId = null,
}) {
  const response = await fetch('/api/users/invite', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      email,
      role,
      organisation_id: organisationId,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Impossible de créer l'invitation");
  }

  return data;
}

export async function copyInvitationLink(invitationUrl) {
  if (!invitationUrl) {
    throw new Error("Lien d'invitation manquant");
  }

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(invitationUrl);
    return;
  }

  window.prompt(
    "Copiez ce lien et envoyez-le à l'utilisateur :",
    invitationUrl
  );
}
