import { useState, useRef } from 'react';
import { UserPlus, AlertCircle, Calendar, AlertTriangle } from 'lucide-react';
import type { Eleve } from '../types';

interface StudentFormProps {
  onAdd: (eleve: Eleve) => void;
  isConfigured: boolean;
}

const emptyEleve: Omit<Eleve, 'id'> = {
  nom: '',
  prenoms: '',
  sexe: 'M',
  date_naissance_probable: '',
  classe: '',
  nom_pere: '',
  numero_pere: '',
  nom_mere: '',
  numero_mere: '',
  nom_temoin: '',
  numero_temoin: '',
};

const CLASSES = [
  'CP1', 'CP2', 'CE1', 'CE2', 'CM1', 'CM2'
];

function checkLocalDuplicate(form: Omit<Eleve, 'id'>): Eleve | null {
  const saved = localStorage.getItem('acese_eleves');
  if (!saved) return null;
  try {
    const eleves: Eleve[] = JSON.parse(saved);
    const nom = form.nom.trim().toUpperCase();
    const prenoms = form.prenoms.trim().toUpperCase();
    return eleves.find(e =>
      e.nom.trim().toUpperCase() === nom &&
      e.prenoms.trim().toUpperCase() === prenoms
    ) || null;
  } catch {
    return null;
  }
}

export function StudentForm({ onAdd, isConfigured }: StudentFormProps) {
  const [form, setForm] = useState<Omit<Eleve, 'id'>>(emptyEleve);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const datePickerRef = useRef<HTMLInputElement>(null);

  if (!isConfigured) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="bg-amber-50 p-6 rounded-2xl border border-amber-200 max-w-sm">
          <AlertCircle size={48} className="text-amber-500 mx-auto mb-4" />
          <h3 className="font-bold text-lg text-amber-800">Configuration requise</h3>
          <p className="text-sm text-amber-600 mt-2">
            Veuillez d'abord configurer les informations de votre école dans l'onglet « Config » avant d'ajouter des élèves.
          </p>
        </div>
      </div>
    );
  }

  const handleChange = (field: keyof Omit<Eleve, 'id'>, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    // Clear duplicate warning on any change
    if (duplicateWarning) setDuplicateWarning(null);
  };

  const handlePhoneChange = (field: keyof Omit<Eleve, 'id'>, value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    handleChange(field, digits);
  };

  const handleDateTextChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    let formatted = '';
    if (digits.length > 0) formatted = digits.slice(0, 2);
    if (digits.length > 2) formatted += '/' + digits.slice(2, 4);
    if (digits.length > 4) formatted += '/' + digits.slice(4, 8);
    handleChange('date_naissance_probable', formatted);
  };

  const handleDatePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val) {
      const [y, m, d] = val.split('-');
      handleChange('date_naissance_probable', `${d}/${m}/${y}`);
    }
  };

  const validatePhone = (value: string, fieldName: string): string | null => {
    if (!value.trim()) return `${fieldName} requis`;
    if (!/^\d{10}$/.test(value)) return '10 chiffres requis';
    if (!/^(07|05|01)/.test(value)) return 'Doit commencer par 07, 05 ou 01';
    return null;
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.nom.trim()) newErrors.nom = 'Nom requis';
    if (!form.prenoms.trim()) newErrors.prenoms = 'Prénoms requis';
    if (!form.date_naissance_probable.trim()) {
      newErrors.date_naissance_probable = 'Date requise';
    } else if (!/^\d{2}\/\d{2}\/\d{4}$/.test(form.date_naissance_probable)) {
      newErrors.date_naissance_probable = 'Format: jj/mm/aaaa';
    }
    if (!form.classe) newErrors.classe = 'Classe requise';
    if (!form.nom_pere.trim()) newErrors.nom_pere = 'Nom du père requis';
    const errPere = validatePhone(form.numero_pere, 'Numéro du père');
    if (errPere) newErrors.numero_pere = errPere;
    if (!form.nom_mere.trim()) newErrors.nom_mere = 'Nom de la mère requis';
    const errMere = validatePhone(form.numero_mere, 'Numéro de la mère');
    if (errMere) newErrors.numero_mere = errMere;
    if (!form.nom_temoin.trim()) newErrors.nom_temoin = 'Nom du témoin requis';
    const errTemoin = validatePhone(form.numero_temoin, 'Numéro du témoin');
    if (errTemoin) newErrors.numero_temoin = errTemoin;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Check local duplicates
    const localDup = checkLocalDuplicate(form);
    if (localDup) {
      setDuplicateWarning(
        `⚠️ Un élève nommé "${localDup.nom} ${localDup.prenoms}" existe déjà dans votre liste (classe ${localDup.classe}).`
      );
      return;
    }

    onAdd({ ...form, id: Date.now().toString() + Math.random().toString(36).slice(2) });
    setForm(emptyEleve);
    setDuplicateWarning(null);
  };

  const inputClass = (field: string) =>
    `w-full px-3 py-2.5 rounded-lg border text-sm transition-colors ${
      errors[field]
        ? 'border-red-400 bg-red-50 focus:border-red-500'
        : 'border-gray-300 bg-white focus:border-ci-green'
    }`;

  const phoneInputClass = (field: string) =>
    `w-full px-3 py-2.5 rounded-lg border text-sm transition-colors ${
      errors[field]
        ? 'border-red-400 bg-red-50 focus:border-red-500'
        : 'border-gray-300 bg-white focus:border-ci-green'
    }`;

  const renderPhoneField = (field: keyof Omit<Eleve, 'id'>, label: string, placeholder: string) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label} *</label>
      <input
        type="tel"
        value={form[field] as string}
        onChange={e => handlePhoneChange(field, e.target.value)}
        className={phoneInputClass(field)}
        placeholder={placeholder}
        maxLength={10}
      />
      {errors[field] && <p className="text-xs text-red-500 mt-1">{errors[field]}</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <UserPlus size={24} className="text-ci-green" />
        <h2 className="text-xl font-bold text-gray-800">Ajouter un élève</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Duplicate warning */}
        {duplicateWarning && (
          <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 flex items-start gap-3 animate-slide-down">
            <AlertTriangle size={20} className="text-red-500 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-800 mb-1">Doublon détecté !</p>
              <p className="text-sm text-red-700">{duplicateWarning}</p>
              <p className="text-xs text-red-500 mt-2">Vérifiez le nom et les prénoms, ou ajoutez un élève différent.</p>
            </div>
            <button
              type="button"
              onClick={() => setDuplicateWarning(null)}
              className="text-red-400 hover:text-red-600 text-lg"
            >
              ×
            </button>
          </div>
        )}

        {/* Identity */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-ci-green to-ci-green-light px-5 py-3">
            <h3 className="font-semibold text-white text-sm">🪪 Identité de l'élève</h3>
          </div>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                <input
                  type="text"
                  value={form.nom}
                  onChange={e => handleChange('nom', e.target.value.toUpperCase())}
                  className={inputClass('nom')}
                  placeholder="KONÉ"
                />
                {errors.nom && <p className="text-xs text-red-500 mt-1">{errors.nom}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prénoms *</label>
                <input
                  type="text"
                  value={form.prenoms}
                  onChange={e => handleChange('prenoms', e.target.value)}
                  className={inputClass('prenoms')}
                  placeholder="Amadou"
                />
                {errors.prenoms && <p className="text-xs text-red-500 mt-1">{errors.prenoms}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sexe *</label>
                <select
                  value={form.sexe}
                  onChange={e => handleChange('sexe', e.target.value)}
                  className={inputClass('sexe')}
                >
                  <option value="M">Masculin</option>
                  <option value="F">Féminin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date de naissance *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.date_naissance_probable}
                    onChange={e => handleDateTextChange(e.target.value)}
                    className={`${inputClass('date_naissance_probable')} flex-1`}
                    placeholder="jj/mm/aaaa"
                    maxLength={10}
                  />
                  <button
                    type="button"
                    onClick={() => datePickerRef.current?.showPicker?.()}
                    className="px-3 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm transition-colors shrink-0"
                    title="Sélectionner une date"
                  >
                    <Calendar size={16} className="text-gray-500" />
                  </button>
                  <input
                    ref={datePickerRef}
                    type="date"
                    className="sr-only"
                    onChange={handleDatePickerChange}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
                {errors.date_naissance_probable && <p className="text-xs text-red-500 mt-1">{errors.date_naissance_probable}</p>}
                <p className="text-xs text-gray-400 mt-1">Saisissez ou 📅 choisissez</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Classe *</label>
                <select
                  value={form.classe}
                  onChange={e => handleChange('classe', e.target.value)}
                  className={inputClass('classe')}
                >
                  <option value="">— Sélectionner —</option>
                  {CLASSES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                {errors.classe && <p className="text-xs text-red-500 mt-1">{errors.classe}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Father info */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-5 py-3">
            <h3 className="font-semibold text-white text-sm">👨 Informations du père</h3>
          </div>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom du père *</label>
                <input
                  type="text"
                  value={form.nom_pere}
                  onChange={e => handleChange('nom_pere', e.target.value.toUpperCase())}
                  className={inputClass('nom_pere')}
                  placeholder="KONÉ"
                />
                {errors.nom_pere && <p className="text-xs text-red-500 mt-1">{errors.nom_pere}</p>}
              </div>
              {renderPhoneField('numero_pere', 'Numéro du père', '07 XX XX XX XX')}
            </div>
          </div>
        </div>

        {/* Mother info */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-pink-500 to-pink-600 px-5 py-3">
            <h3 className="font-semibold text-white text-sm">👩 Informations de la mère</h3>
          </div>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom de la mère *</label>
                <input
                  type="text"
                  value={form.nom_mere}
                  onChange={e => handleChange('nom_mere', e.target.value.toUpperCase())}
                  className={inputClass('nom_mere')}
                  placeholder="DOKO"
                />
                {errors.nom_mere && <p className="text-xs text-red-500 mt-1">{errors.nom_mere}</p>}
              </div>
              {renderPhoneField('numero_mere', 'Numéro de la mère', '05 XX XX XX XX')}
            </div>
          </div>
        </div>

        {/* Witness info */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-3">
            <h3 className="font-semibold text-white text-sm">🤝 Informations du témoin</h3>
          </div>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom du témoin *</label>
                <input
                  type="text"
                  value={form.nom_temoin}
                  onChange={e => handleChange('nom_temoin', e.target.value.toUpperCase())}
                  className={inputClass('nom_temoin')}
                  placeholder="YAO"
                />
                {errors.nom_temoin && <p className="text-xs text-red-500 mt-1">{errors.nom_temoin}</p>}
              </div>
              {renderPhoneField('numero_temoin', 'Numéro du témoin', '01 XX XX XX XX')}
            </div>
          </div>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-ci-green to-ci-green-light text-white font-semibold rounded-xl shadow-lg shadow-green-200 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all"
        >
          <UserPlus size={20} />
          <span>Ajouter cet élève</span>
        </button>
      </form>
    </div>
  );
}
