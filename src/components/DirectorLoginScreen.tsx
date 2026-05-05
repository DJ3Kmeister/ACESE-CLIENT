import { useState } from 'react';
import { GraduationCap, Lock, User, Eye, EyeOff, WifiOff } from 'lucide-react';
import type { SchoolConfig } from '../types';

interface Props {
  serverUrl: string;
  isOnline: boolean;
  onLoginSuccess: (config: SchoolConfig) => void;
}

export function DirectorLoginScreen({ serverUrl, isOnline, onLoginSuccess }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const login = async () => {
    setError('');
    if (!isOnline) {
      setError('Première connexion impossible hors ligne. Connectez-vous à internet.');
      return;
    }
    if (!username.trim() || !password) {
      setError('Identifiant et mot de passe requis.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${serverUrl}/api/director-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Connexion refusée.');
        return;
      }
      onLoginSuccess(data.config);
    } catch {
      setError('Impossible de joindre le serveur. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
        <div className="bg-gradient-to-r from-ci-green-dark to-ci-green text-white p-8 text-center">
          <div className="mx-auto w-20 h-20 rounded-3xl bg-white/15 flex items-center justify-center mb-5">
            <GraduationCap size={40} />
          </div>
          <h1 className="text-3xl font-bold">ACESE</h1>
          <p className="text-green-100 text-sm mt-2">Connexion Directeur — IEPP GRABO</p>
        </div>

        <div className="p-6 space-y-5">
          {!isOnline && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm flex gap-2">
              <WifiOff size={18} className="shrink-0" />
              <span>Internet requis pour la première connexion.</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Identifiant</label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-ci-green"
                placeholder="Ex: EPPGNATO01"
                autoFocus
              />
              <User size={17} className="absolute right-3 top-3.5 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Mot de passe</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && login()}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-ci-green"
                placeholder="Mot de passe fourni"
              />
              <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-3.5 text-gray-400">
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>}

          <button
            onClick={login}
            disabled={loading || !isOnline}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-ci-green text-white font-bold rounded-xl hover:bg-ci-green-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Lock size={18} />
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>

          <div className="text-center text-xs text-gray-400 leading-relaxed">
            Identifiants fournis par l'administrateur.<br />Après la première connexion, l'application fonctionne hors ligne.
          </div>
        </div>
      </div>
    </div>
  );
}