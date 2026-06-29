import React, { useEffect, useState } from 'react';

export default function AcceptInvitation() {
  const token = new URLSearchParams(window.location.search).get('token');

  const [invitation, setInvitation] = useState(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadInvitation() {
      try {
        if (!token) {
          throw new Error("Token d'invitation manquant");
        }

        const response = await fetch(
          `/api/invitations/${encodeURIComponent(token)}`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Invitation invalide');
        }

        setInvitation(data);
      } catch (err) {
        setError(err.message || 'Invitation invalide');
      } finally {
        setLoading(false);
      }
    }

    loadInvitation();
  }, [token]);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const response = await fetch(
        `/api/invitations/${encodeURIComponent(token)}/accept`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Impossible d'accepter l'invitation"
        );
      }

      setSuccess(true);
    } catch (err) {
      setError(err.message || "Impossible d'accepter l'invitation");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <p>Chargement de l’invitation…</p>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
          <h1 className="text-2xl font-bold text-slate-900">
            Invitation invalide
          </h1>
          <p className="mt-4 text-red-700">{error}</p>
          <a
            href="/"
            className="mt-6 inline-block rounded-lg bg-blue-800 px-4 py-2 text-white"
          >
            Retour à la connexion
          </a>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
          <h1 className="text-2xl font-bold text-slate-900">
            Compte créé
          </h1>
          <p className="mt-4 text-slate-600">
            Votre compte est actif. Vous pouvez maintenant vous connecter.
          </p>
          <a
            href="/"
            className="mt-6 inline-block rounded-lg bg-blue-800 px-4 py-2 text-white"
          >
            Aller à la connexion
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-800 to-blue-950 flex items-center justify-center p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl"
      >
        <h1 className="text-2xl font-bold text-slate-900">
          Rejoindre l’organisation
        </h1>

        <p className="mt-2 text-slate-600">
          Invitation pour <strong>{invitation?.email}</strong>
        </p>

        <p className="mt-1 text-sm text-slate-500">
          Rôle prévu : {invitation?.role || 'agent'}
        </p>

        <label className="mt-6 block text-sm font-medium text-slate-700">
          Prénom
        </label>
        <input
          className="mt-2 w-full rounded-lg border px-3 py-2"
          value={firstName}
          onChange={(event) => setFirstName(event.target.value)}
          required
          disabled={submitting}
        />

        <label className="mt-4 block text-sm font-medium text-slate-700">
          Nom
        </label>
        <input
          className="mt-2 w-full rounded-lg border px-3 py-2"
          value={lastName}
          onChange={(event) => setLastName(event.target.value)}
          required
          disabled={submitting}
        />

        <label className="mt-4 block text-sm font-medium text-slate-700">
          Mot de passe
        </label>
        <input
          className="mt-2 w-full rounded-lg border px-3 py-2"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength={8}
          required
          disabled={submitting}
        />

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-6 w-full rounded-lg bg-blue-800 px-4 py-2.5 font-semibold text-white disabled:opacity-60"
        >
          {submitting ? 'Création…' : 'Créer mon compte'}
        </button>
      </form>
    </div>
  );
}
