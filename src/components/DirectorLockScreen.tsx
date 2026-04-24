import { useState } from 'react';
import { Lock, Phone, User, RotateCcw, KeyRound, Eye, EyeOff, Sparkles, CheckCircle } from 'lucide-react';
import type { SchoolConfig } from '../types';

type RecoverResult = { found: boolean; message?: string };

interface Props {
  visible: boolean;
  config: SchoolConfig;
  onUnlock: (password: string) => Promise<boolean>;
  onRecover: (payload: { nom_directeur: string; contact1: string; nom_ecole?: string }) => Promise<RecoverResult>;
  onResetPassword: (newPassword: string) => Promise<void>;
}

export function DirectorLockScreen({ visible, config, onUnlock, onRecover, onResetPassword }: Props) {
  const [mode, setMode] = useState<'unlock' | 'recover' | 'reset'>('unlock');
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [recoveryName, setRecoveryName] = useState(config.nom_directeur || '');
  const [recoveryPhone, setRecoveryPhone] = useState(config.contact1 || '');
  const [recoverySchool, setRecoverySchool] = useState(config.nom_ecole || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  if (!visible) return null;

  const submitUnlock = async () => {
    setLoading(true);
    setMessage('');
    const ok = await onUnlock(password);
    if (!ok) setMessage('Mot de passe incorrect.');
    setLoading(false);
  };

  const submitRecover = async () => {
    setLoading(true);
    setMessage('');
    const result = await onRecover({ nom_directeur: recoveryName, contact1: recoveryPhone, nom_ecole: recoverySchool });
    if (result.found) {
      setMode('reset');
      setMessage('Identité vérifiée. Choisissez un nouveau mot de passe.');
    } else {
      setMessage(result.message || 'Aucun profil correspondant trouvé.');
    }
    setLoading(false);
  };

  const submitReset = async () => {
    if (!newPassword || newPassword !== confirmPassword) {
      setMessage('Les mots de passe ne correspondent pas.');
      return;
    }
    setLoading(true);
    setMessage('');
    await onResetPassword(newPassword);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[120] bg-slate-950/95 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-white/10">
        <div className="bg-gradient-to-r from-ci-green-dark to-ci-green p-6 text-white text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-4">
            <Lock size={28} />
          </div>
          <h1 className="text-2xl font-bold">Accès protégé</h1>
          <p className="text-sm text-green-100 mt-2">
            {config.nom_ecole || 'Votre école'}
          </p>
        </div>

        <div className="p-6 space-y-4">
          {mode === 'unlock' && (
            <>
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Saisissez votre mot de passe pour continuer.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-ci-green"
                    placeholder="Votre mot de passe"
                    onKeyDown={e => e.key === 'Enter' && submitUnlock()}
                    autoFocus
                  />
                  <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-3.5 text-gray-400">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {message && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{message}</p>}

              <button
                onClick={submitUnlock}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-ci-green text-white font-semibold rounded-xl hover:bg-ci-green-dark transition-colors disabled:opacity-70"
              >
                <KeyRound size={18} />
                {loading ? 'Vérification...' : 'Déverrouiller'}
              </button>

              <button
                type="button"
                onClick={() => { setMode('recover'); setMessage(''); }}
                className="w-full text-sm text-gray-500 hover:text-ci-green transition-colors"
              >
                Mot de passe oublié ?
              </button>
            </>
          )}

          {mode === 'recover' && (
            <>
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Vérifiez votre identité avec les informations saisies lors de la configuration.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom du directeur</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={recoveryName}
                      onChange={e => setRecoveryName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-ci-green"
                      placeholder="KONÉ"
                    />
                    <User size={16} className="absolute right-3 top-3.5 text-gray-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de téléphone</label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={recoveryPhone}
                      onChange={e => setRecoveryPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-ci-green"
                      placeholder="07XXXXXXXX"
                    />
                    <Phone size={16} className="absolute right-3 top-3.5 text-gray-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">École (facultatif)</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={recoverySchool}
                      onChange={e => setRecoverySchool(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-ci-green"
                      placeholder="EPP GNATO"
                    />
                    <Sparkles size={16} className="absolute right-3 top-3.5 text-gray-400" />
                  </div>
                </div>
              </div>

              {message && <p className="text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">{message}</p>}

              <button
                onClick={submitRecover}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-amber-500 text-white font-semibold rounded-xl hover:bg-amber-600 transition-colors disabled:opacity-70"
              >
                <RotateCcw size={18} />
                {loading ? 'Vérification...' : 'Vérifier mon identité'}
              </button>

              <button type="button" onClick={() => { setMode('unlock'); setMessage(''); }} className="w-full text-sm text-gray-500 hover:text-ci-green transition-colors">
                Retour au mot de passe
              </button>
            </>
          )}

          {mode === 'reset' && (
            <>
              <div className="text-center">
                <p className="text-sm text-gray-600">Choisissez un nouveau mot de passe.</p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-ci-green"
                    placeholder="Nouveau mot de passe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-ci-green"
                    placeholder="Confirmer le mot de passe"
                  />
                </div>
                <button type="button" onClick={() => setShowPassword(v => !v)} className="text-xs text-gray-500 hover:text-gray-700">
                  {showPassword ? 'Masquer' : 'Afficher'} le mot de passe
                </button>
              </div>

              {message && <p className="text-sm text-gray-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">{message}</p>}

              <button
                onClick={submitReset}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-ci-green text-white font-semibold rounded-xl hover:bg-ci-green-dark transition-colors disabled:opacity-70"
              >
                <CheckCircle size={18} />
                {loading ? 'Enregistrement...' : 'Enregistrer le nouveau mot de passe'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}