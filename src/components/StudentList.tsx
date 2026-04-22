import { useState } from 'react';
import { List, Search, Trash2, User, AlertTriangle, Eye, X, Download } from 'lucide-react';
import type { Eleve, SchoolConfig } from '../types';

interface StudentListProps {
  eleves: Eleve[];
  onRemove: (id: string) => void;
  onClear: () => void;
  config: SchoolConfig;
  onExport: () => void;
}

export function StudentList({ eleves, onRemove, onClear, config, onExport }: StudentListProps) {
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [viewStudent, setViewStudent] = useState<Eleve | null>(null);

  const filtered = eleves.filter(e => {
    const q = search.toLowerCase();
    return e.nom.toLowerCase().includes(q) ||
           e.prenoms.toLowerCase().includes(q) ||
           e.classe.toLowerCase().includes(q);
  });

  // Group by class
  const grouped = filtered.reduce<Record<string, Eleve[]>>((acc, eleve) => {
    const key = eleve.classe || 'Non classé';
    if (!acc[key]) acc[key] = [];
    acc[key].push(eleve);
    return acc;
  }, {});

  const handleRemove = (id: string) => {
    if (confirmDelete === id) {
      onRemove(id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  if (eleves.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="bg-gray-50 p-8 rounded-2xl border border-gray-200 max-w-sm">
          <List size={48} className="text-gray-300 mx-auto mb-4" />
          <h3 className="font-bold text-lg text-gray-500">Aucun élève</h3>
          <p className="text-sm text-gray-400 mt-2">
            Les élèves que vous ajoutez apparaîtront ici. Allez dans l'onglet « Ajouter » pour commencer.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <List size={24} className="text-ci-green" />
          <h2 className="text-xl font-bold text-gray-800">
            Liste des élèves
            <span className="ml-2 text-sm font-normal text-gray-500">({eleves.length})</span>
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onExport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
          >
            <Download size={14} />
            Exporter Excel
          </button>
          <button
            onClick={onClear}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
          >
            <Trash2 size={14} />
            Tout supprimer
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm focus:border-ci-green"
          placeholder="Rechercher par nom, prénom ou classe..."
        />
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-blue-600">{eleves.length}</p>
          <p className="text-xs text-blue-500">Total</p>
        </div>
        <div className="bg-sky-50 border border-sky-200 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-sky-600">
            {eleves.filter(e => e.sexe === 'M').length}
          </p>
          <p className="text-xs text-sky-500">Garçons</p>
        </div>
        <div className="bg-pink-50 border border-pink-200 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-pink-600">
            {eleves.filter(e => e.sexe === 'F').length}
          </p>
          <p className="text-xs text-pink-500">Filles</p>
        </div>
      </div>

      {/* School info badge */}
      {config.nom_ecole && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg px-4 py-2 text-xs text-amber-700">
          📋 <strong>{config.nom_ecole}</strong> — {config.secteur_pedagogique} — Directeur: {config.nom_directeur} {config.prenoms_directeur}
        </div>
      )}

      {/* Grouped list */}
      {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([classe, students]) => (
        <div key={classe} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-sm text-gray-700">📚 {classe}</h3>
            <span className="text-xs bg-ci-green/10 text-ci-green font-medium px-2 py-0.5 rounded-full">
              {students.length} élève(s)
            </span>
          </div>
          <div className="divide-y divide-gray-100">
            {students.map((eleve, idx) => (
              <div
                key={eleve.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                  eleve.sexe === 'M' ? 'bg-sky-500' : 'bg-pink-500'
                }`}>
                  {eleve.nom.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {idx + 1}. {eleve.nom} {eleve.prenoms}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    Né(e) le {eleve.date_naissance_probable} • {eleve.sexe === 'M' ? '♂' : '♀'}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setViewStudent(eleve)}
                    className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Voir les détails"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={() => handleRemove(eleve.id)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      confirmDelete === eleve.id
                        ? 'text-red-600 bg-red-100'
                        : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                    }`}
                    title={confirmDelete === eleve.id ? 'Confirmer la suppression' : 'Supprimer'}
                  >
                    {confirmDelete === eleve.id ? (
                      <AlertTriangle size={16} />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Student detail modal */}
      {viewStudent && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setViewStudent(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-ci-green to-ci-green-light p-5 flex items-center justify-between">
              <div className="flex items-center gap-3 text-white">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                  viewStudent.sexe === 'M' ? 'bg-sky-400' : 'bg-pink-400'
                }`}>
                  <User size={20} />
                </div>
                <div>
                  <h3 className="font-bold">{viewStudent.nom} {viewStudent.prenoms}</h3>
                  <p className="text-sm text-green-200">Classe: {viewStudent.classe}</p>
                </div>
              </div>
              <button onClick={() => setViewStudent(null)} className="text-white/80 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-gray-500 text-xs">Sexe</p>
                  <p className="font-medium">{viewStudent.sexe === 'M' ? 'Masculin ♂' : 'Féminin ♀'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Date de naissance</p>
                  <p className="font-medium">{viewStudent.date_naissance_probable}</p>
                </div>
              </div>
              <hr />
              <div>
                <p className="text-xs font-semibold text-blue-600 mb-2">👨 Père</p>
                <p className="font-medium">{viewStudent.nom_pere}</p>
                <p className="text-gray-500">{viewStudent.numero_pere}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-pink-600 mb-2">👩 Mère</p>
                <p className="font-medium">{viewStudent.nom_mere}</p>
                <p className="text-gray-500">{viewStudent.numero_mere}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-amber-600 mb-2">🤝 Témoin</p>
                <p className="font-medium">{viewStudent.nom_temoin}</p>
                <p className="text-gray-500">{viewStudent.numero_temoin}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
