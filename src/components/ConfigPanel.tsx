import { useState } from 'react';
import { Save, School, User, Phone, Mail, CheckCircle, AlertCircle, Edit3, Lock, KeyRound, Eye, EyeOff } from 'lucide-react';
import type { SchoolConfig, SecteurInfo } from '../types';
import { hashPassword, makeSalt } from '../utils/password';

interface ConfigPanelProps {
  config: SchoolConfig;
  onSave: (config: SchoolConfig) => void;
  isConfigured: boolean;
  secteurs: SecteurInfo[];
  onResetLocalConfig: () => void;
}

export function ConfigPanel({ config, onSave, isConfigured, secteurs, onResetLocalConfig }: ConfigPanelProps) {
  const [form, setForm] = useState<SchoolConfig>(config);
  const [errors, setErrors] = useState<Partial<Record<keyof SchoolConfig, string>>>({});
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authMessage, setAuthMessage] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  // Get schools for the selected sector
  const selectedSecteur = secteurs.find(s => s.nom === form.secteur_pedagogique);
  const ecoles = selectedSecteur?.ecoles || [];

  const handleChange = (field: keyof SchoolConfig, value: string) => {
    // If changing sector, reset school
    if (field === 'secteur_pedagogique') {
      setForm(prev => ({ ...prev, [field]: value, nom_ecole: '' }));
    } else {
      setForm(prev => ({ ...prev, [field]: value }));
    }
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handlePhoneChange = (field: 'contact1' | 'contact2', value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    setForm(prev => ({ ...prev, [field]: digits }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof SchoolConfig, string>> = {};
    if (!form.secteur_pedagogique.trim()) newErrors.secteur_pedagogique = 'Secteur requis';
    if (!form.nom_ecole.trim()) newErrors.nom_ecole = 'Nom de l\'école requis';
    if (!form.nom_directeur.trim()) newErrors.nom_directeur = 'Nom du directeur requis';
    if (!form.prenoms_directeur.trim()) newErrors.prenoms_directeur = 'Prénoms requis';
    if (!form.contact1 || !/^\d{10}$/.test(form.contact1)) {
      newErrors.contact1 = '10 chiffres requis';
    } else if (!/^(07|05|01)/.test(form.contact1)) {
      newErrors.contact1 = 'Doit commencer par 07, 05 ou 01';
    }
    if (form.contact2 && !/^\d{10}$/.test(form.contact2)) {
      newErrors.contact2 = '10 chiffres requis';
    } else if (form.contact2 && !/^(07|05|01)/.test(form.contact2)) {
      newErrors.contact2 = 'Doit commencer par 07, 05 ou 01';
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Email invalide';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthMessage('');

    if (!validate()) return;

    const needsPasswordSetup = !config.director_password_hash;
    if (needsPasswordSetup || password || confirmPassword) {
      if (!password || !confirmPassword) {
        setAuthError('Veuillez entrer et confirmer le mot de passe.');
        return;
      }
      if (password !== confirmPassword) {
        setAuthError('Les mots de passe ne correspondent pas.');
        return;
      }
    }

    setIsSaving(true);
    try {
      let finalConfig = { ...form };

      let passwordHash = config.director_password_hash || '';
      let passwordSalt = config.director_password_salt || '';

      if (password) {
        const saltHex = makeSalt();
        const hash = await hashPassword(password, saltHex);
        passwordHash = hash;
        passwordSalt = saltHex;
        finalConfig = {
          ...finalConfig,
          director_password_hash: hash,
          director_password_salt: saltHex,
        };
      } else if (config.director_password_hash && config.director_password_salt) {
        finalConfig = {
          ...finalConfig,
          director_password_hash: config.director_password_hash,
          director_password_salt: config.director_password_salt,
        };
      }

      // Save profile to server for recovery whenever we have a password hash
      if (passwordHash && passwordSalt) {
        try {
          await fetch(`${form.serverUrl}/api/director-profile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              nom_directeur: finalConfig.nom_directeur,
              prenoms_directeur: finalConfig.prenoms_directeur,
              nom_ecole: finalConfig.nom_ecole,
              secteur_pedagogique: finalConfig.secteur_pedagogique,
              contact1: finalConfig.contact1,
              contact2: finalConfig.contact2,
              email: finalConfig.email,
              password_hash: passwordHash,
              password_salt: passwordSalt,
            }),
          });
        } catch {
          setAuthMessage('Configuration enregistrée localement. Le profil sera synchronisé plus tard.');
        }
      }

      onSave(finalConfig);
      setPassword('');
      setConfirmPassword('');
      setAuthMessage('Configuration enregistrée.');
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass = (field: keyof SchoolConfig) =>
    `w-full px-4 py-2.5 rounded-lg border text-sm transition-colors ${
      errors[field]
        ? 'border-red-400 bg-red-50 focus:border-red-500'
        : 'border-gray-300 bg-white focus:border-ci-green'
    }`;

  const lockedInputClass = 'w-full px-4 py-2.5 rounded-lg border text-sm bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed';

  return (
    <div className="space-y-6">
      {/* Status banner */}
      <div className={`flex items-center gap-3 p-4 rounded-xl ${
        isConfigured ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'
      }`}>
        {isConfigured ? (
          <>
            <CheckCircle size={24} className="text-green-500 shrink-0" />
            <div>
              <p className="font-semibold text-green-800">École configurée</p>
              <p className="text-sm text-green-600">
                {config.nom_ecole} — {config.secteur_pedagogique}
              </p>
            </div>
            <Edit3 size={18} className="text-green-500 ml-auto shrink-0" />
          </>
        ) : (
          <>
            <AlertCircle size={24} className="text-amber-500 shrink-0" />
            <div>
              <p className="font-semibold text-amber-800">Configuration requise</p>
              <p className="text-sm text-amber-600">Remplissez les informations de votre école pour commencer</p>
            </div>
          </>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => {
            const ok = window.confirm('Réinitialiser uniquement la configuration locale ? Les élèves ne seront pas effacés.');
            if (ok) onResetLocalConfig();
          }}
          className="text-xs px-3 py-2 rounded-lg border border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors"
        >
          Réinitialiser la config locale
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* School info section */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-ci-green to-ci-green-light px-5 py-3 flex items-center gap-2">
            <School size={20} className="text-white" />
            <h2 className="font-semibold text-white">Informations de l'école</h2>
          </div>
          <div className="p-5 space-y-4">
            {/* DRENAET + IEPP (readonly) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  DRENAET *
                  <Lock size={12} className="text-gray-400" />
                </label>
                <input
                  type="text"
                  value={form.drenaet}
                  readOnly
                  className={lockedInputClass}
                />
                <p className="text-xs text-gray-400 mt-1">Champ automatique — non modifiable</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  IEPP *
                  <Lock size={12} className="text-gray-400" />
                </label>
                <input
                  type="text"
                  value={form.iepp}
                  readOnly
                  className={lockedInputClass}
                />
                <p className="text-xs text-gray-400 mt-1">Champ automatique — non modifiable</p>
              </div>
            </div>
            {/* Secteur pédagogique (dropdown from server) + Nom de l'école (dropdown from sector) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Secteur pédagogique *</label>
                <select
                  value={form.secteur_pedagogique}
                  onChange={e => handleChange('secteur_pedagogique', e.target.value)}
                  className={inputClass('secteur_pedagogique')}
                >
                  <option value="">— Sélectionner un secteur —</option>
                  {secteurs.map(s => (
                    <option key={s.id} value={s.nom}>{s.nom}</option>
                  ))}
                </select>
                {errors.secteur_pedagogique && <p className="text-xs text-red-500 mt-1">{errors.secteur_pedagogique}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'école *</label>
                {ecoles.length > 0 ? (
                  <select
                    value={form.nom_ecole}
                    onChange={e => handleChange('nom_ecole', e.target.value)}
                    className={inputClass('nom_ecole')}
                  >
                    <option value="">— Sélectionner votre école —</option>
                    {ecoles.map(e => (
                      <option key={e.id} value={e.nom}>{e.nom}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={form.nom_ecole}
                    onChange={e => handleChange('nom_ecole', e.target.value)}
                    className={inputClass('nom_ecole')}
                    placeholder="EPP GNATO"
                  />
                )}
                {ecoles.length === 0 && (
                  <p className="text-xs text-amber-500 mt-1">⚠️ Aucune école configurée pour ce secteur. Saisissez le nom manuellement.</p>
                )}
                {errors.nom_ecole && <p className="text-xs text-red-500 mt-1">{errors.nom_ecole}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Director info section */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-ci-orange to-amber-500 px-5 py-3 flex items-center gap-2">
            <User size={20} className="text-white" />
            <h2 className="font-semibold text-white">Informations du directeur</h2>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom du directeur *</label>
                <input
                  type="text"
                  value={form.nom_directeur}
                  onChange={e => handleChange('nom_directeur', e.target.value.toUpperCase())}
                  className={inputClass('nom_directeur')}
                  placeholder="Ex: KONÉ"
                />
                {errors.nom_directeur && <p className="text-xs text-red-500 mt-1">{errors.nom_directeur}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prénoms du directeur *</label>
                <input
                  type="text"
                  value={form.prenoms_directeur}
                  onChange={e => handleChange('prenoms_directeur', e.target.value)}
                  className={inputClass('prenoms_directeur')}
                  placeholder="Ex: Amadou"
                />
                {errors.prenoms_directeur && <p className="text-xs text-red-500 mt-1">{errors.prenoms_directeur}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Contact info section */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-5 py-3 flex items-center gap-2">
            <Phone size={20} className="text-white" />
            <h2 className="font-semibold text-white">Contacts</h2>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact 1 *</label>
                <div className="relative">
                  <input
                    type="tel"
                    value={form.contact1}
                    onChange={e => handlePhoneChange('contact1', e.target.value)}
                    className={inputClass('contact1')}
                    placeholder="07 XX XX XX XX"
                    maxLength={10}
                  />
                  {form.contact1.length === 10 && /^(07|05|01)/.test(form.contact1) && <CheckCircle size={16} className="absolute right-3 top-3 text-green-500" />}
                </div>
                {errors.contact1 && <p className="text-xs text-red-500 mt-1">{errors.contact1}</p>}
                <p className="text-xs text-gray-400 mt-1">10 chiffres — doit commencer par 07, 05 ou 01</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact 2 (facultatif)</label>
                <input
                  type="tel"
                  value={form.contact2}
                  onChange={e => handlePhoneChange('contact2', e.target.value)}
                  className={inputClass('contact2')}
                  placeholder="05 XX XX XX XX"
                  maxLength={10}
                />
                {errors.contact2 && <p className="text-xs text-red-500 mt-1">{errors.contact2}</p>}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Mail size={14} />
                Email (facultatif)
              </label>
              <input
                type="email"
                value={form.email}
                onChange={e => handleChange('email', e.target.value)}
                className={inputClass('email')}
                placeholder="directeur@exemple.ci"
              />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            </div>
          </div>
        </div>

        {/* Password section */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-slate-700 to-slate-900 px-5 py-3 flex items-center gap-2">
            <KeyRound size={20} className="text-white" />
            <h2 className="font-semibold text-white">Mot de passe du directeur</h2>
          </div>
          <div className="p-5 space-y-3">
            <p className="text-sm text-gray-600">
              Créez un mot de passe pour verrouiller l'application après 1 heure d'inactivité. Il vous sera demandé à la réouverture.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe {config.director_password_hash ? '(nouveau seulement)' : '*'}</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className={inputClass('email')}
                    placeholder={config.director_password_hash ? 'Laisser vide pour conserver' : 'Créer un mot de passe'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer le mot de passe</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className={inputClass('email')}
                  placeholder="Confirmer le mot de passe"
                />
              </div>
            </div>
            <p className="text-xs text-gray-400">
              Conseil: choisissez un mot de passe simple à retenir mais difficile à deviner.
            </p>
          </div>
        </div>

        {authError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{authError}</p>}
        {authMessage && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3">{authMessage}</p>}

        {/* Submit button */}
        <button
          type="submit"
          disabled={isSaving}
          className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-ci-green to-ci-green-light text-white font-semibold rounded-xl shadow-lg shadow-green-200 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
        >
          <Save size={20} />
          <span>{isSaving ? 'Enregistrement...' : isConfigured ? 'Mettre à jour la configuration' : 'Enregistrer la configuration'}</span>
        </button>
      </form>
    </div>
  );
}
