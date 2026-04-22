import { BarChart3, Users, BookOpen } from 'lucide-react';
import type { Eleve, SchoolConfig } from '../types';

interface StatsPanelProps {
  eleves: Eleve[];
  config: SchoolConfig;
}

export function StatsPanel({ eleves, config }: StatsPanelProps) {
  const garcons = eleves.filter(e => e.sexe === 'M');
  const filles = eleves.filter(e => e.sexe === 'F');

  // Group by class
  const parClasse: Record<string, { total: number; garcons: number; filles: number }> = {};
  eleves.forEach(e => {
    const c = e.classe || 'Non classé';
    if (!parClasse[c]) parClasse[c] = { total: 0, garcons: 0, filles: 0 };
    parClasse[c].total++;
    if (e.sexe === 'M') parClasse[c].garcons++;
    else parClasse[c].filles++;
  });

  const sortedClasses = Object.entries(parClasse).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BarChart3 size={24} className="text-ci-green" />
        <h2 className="text-xl font-bold text-gray-800">Statistiques</h2>
      </div>

      {eleves.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="bg-gray-50 p-8 rounded-2xl border border-gray-200 max-w-sm">
            <BarChart3 size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="font-bold text-lg text-gray-500">Aucune donnée</h3>
            <p className="text-sm text-gray-400 mt-2">
              Les statistiques apparaîtront une fois que vous aurez ajouté des élèves.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Main stats cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gradient-to-br from-ci-green to-ci-green-light rounded-xl p-4 text-white text-center shadow-lg">
              <Users size={24} className="mx-auto mb-1 opacity-80" />
              <p className="text-3xl font-bold">{eleves.length}</p>
              <p className="text-xs text-green-200">Total</p>
            </div>
            <div className="bg-gradient-to-br from-sky-500 to-sky-600 rounded-xl p-4 text-white text-center shadow-lg">
              <span className="text-2xl">♂</span>
              <p className="text-3xl font-bold">{garcons.length}</p>
              <p className="text-xs text-sky-200">Garçons</p>
            </div>
            <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl p-4 text-white text-center shadow-lg">
              <span className="text-2xl">♀</span>
              <p className="text-3xl font-bold">{filles.length}</p>
              <p className="text-xs text-pink-200">Filles</p>
            </div>
          </div>

          {/* Ratio bar */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Répartition par sexe</h3>
            <div className="flex rounded-full overflow-hidden h-6 bg-gray-100">
              {garcons.length > 0 && (
                <div
                  className="bg-sky-500 flex items-center justify-center text-white text-xs font-bold transition-all"
                  style={{ width: `${(garcons.length / eleves.length) * 100}%` }}
                >
                  {((garcons.length / eleves.length) * 100).toFixed(0)}%
                </div>
              )}
              {filles.length > 0 && (
                <div
                  className="bg-pink-500 flex items-center justify-center text-white text-xs font-bold transition-all"
                  style={{ width: `${(filles.length / eleves.length) * 100}%` }}
                >
                  {((filles.length / eleves.length) * 100).toFixed(0)}%
                </div>
              )}
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500" /> Garçons: {garcons.length}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-pink-500" /> Filles: {filles.length}
              </span>
            </div>
          </div>

          {/* Per class breakdown */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-ci-green to-ci-green-light px-5 py-3 flex items-center gap-2">
              <BookOpen size={18} className="text-white" />
              <h3 className="font-semibold text-white text-sm">Répartition par classe</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {sortedClasses.map(([classe, data]) => (
                <div key={classe} className="px-4 py-3 flex items-center gap-4">
                  <div className="w-16 text-sm font-semibold text-gray-700">{classe}</div>
                  <div className="flex-1">
                    <div className="flex rounded-full overflow-hidden h-4 bg-gray-100">
                      {data.garcons > 0 && (
                        <div
                          className="bg-sky-400 transition-all"
                          style={{ width: `${(data.garcons / data.total) * 100}%` }}
                        />
                      )}
                      {data.filles > 0 && (
                        <div
                          className="bg-pink-400 transition-all"
                          style={{ width: `${(data.filles / data.total) * 100}%` }}
                        />
                      )}
                    </div>
                  </div>
                  <div className="text-right min-w-[80px]">
                    <span className="text-sm font-bold text-gray-800">{data.total}</span>
                    <span className="text-xs text-gray-400 ml-1">
                      ({data.garcons}♂ {data.filles}♀)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* School info recap */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5">
            <h3 className="font-semibold text-amber-800 text-sm mb-3">📋 Récapitulatif de l'école</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-amber-600 text-xs">École</p>
                <p className="font-medium text-amber-900">{config.nom_ecole || '—'}</p>
              </div>
              <div>
                <p className="text-amber-600 text-xs">Secteur</p>
                <p className="font-medium text-amber-900">{config.secteur_pedagogique || '—'}</p>
              </div>
              <div>
                <p className="text-amber-600 text-xs">Directeur</p>
                <p className="font-medium text-amber-900">{config.nom_directeur} {config.prenoms_directeur}</p>
              </div>
              <div>
                <p className="text-amber-600 text-xs">Contact</p>
                <p className="font-medium text-amber-900">{config.contact1 || '—'}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
