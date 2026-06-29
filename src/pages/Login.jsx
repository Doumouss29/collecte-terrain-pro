import React, { useState } from 'react';

export default function Login({ onSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();

    const normalizedEmail = email.trim();

    if (!normalizedEmail || !password) {
      setError('Email et mot de passe obligatoires');
      return;
    }

    if (typeof onSuccess !== 'function') {
      setError('La fonction de connexion est indisponible');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await onSuccess(normalizedEmail, password);
    } catch (err) {
      console.error('Erreur de connexion :', err);
      setError(err?.message || 'Connexion impossible');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-800 to-blue-950 flex items-center justify-center p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl"
      >
        <h1 className="text-2xl font-bold text-slate-900">
          Connexion
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Accédez à Collecte Terrain Pro.
        </p>

        <label
          htmlFor="email"
          className="mt-6 block text-sm font-medium text-slate-700"
        >
          Adresse email
        </label>

        <input
          id="email"
          name="email"
          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-200"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          autoComplete="email"
          disabled={loading}
        />

        <label
          htmlFor="password"
          className="mt-4 block text-sm font-medium text-slate-700"
        >
          Mot de passe
        </label>

        <input
          id="password"
          name="password"
          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-200"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          autoComplete="current-password"
          disabled={loading}
        />

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-lg bg-blue-800 px-4 py-2.5 font-semibold text-white hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
    </div>
  );
}
