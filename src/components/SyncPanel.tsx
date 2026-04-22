import { useState } from 'react';
import { RefreshCw, Send, CheckCircle, AlertCircle, WifiOff, CloudOff, Download } from 'lucide-react';
import type { Eleve, SchoolConfig } from '../types';

interface SyncPanelProps {
  eleves: Eleve[];
  config: SchoolConfig;
  isOnline: boolean;
  isConfigured: boolean;
  onSync: () => Promise<boolean>;
  onExport: () => void;
}

export function SyncPanel({ eleves, config, isOnline, isConfigured, onSync, onExport }: SyncPanelProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<'success' | 'error' | null>(null);

  const handleSync = async () => {
    setIsSyncing(true);
    setLastSyncResult(null);
    const result = await onSync();
    setLastSyncResult(result ? 'success' : 'error');
    setIsSyncing(false);
  };

  const canSync = isConfigured && eleves.length > 0 && isOnline;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <RefreshCw size={24} className="text-ci-green" />
        <h2 className="text-xl font-bold text-gray-800">Synchronisation</h2>
      </div>

      {/* Connection status */}
      <div className={`flex items-center gap-3 p-4 rounded-xl border ${
        isOnline ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
      }`}>
        {isOnline ? (
          <>
            <CheckCircle size={24} className="text-green-500 shrink-0" />
            <div>
              <p className="font-semibold text-green-800">Connecté à Internet</p>
              <p className="text-sm text-green-600">Vous pouvez envoyer vos données au serveur</p>
            </div>
          </>
        ) : (
          <>
            <WifiOff size={24} className="text-red-500 shrink-0" />
            <div>
              <p className="font-semibold text-red-800">Hors connexion</p>
              <p className="text-sm text-red-600">Connectez-vous à Internet pour synchroniser</p>
            </div>
          </>
        )}
      </div>

      {/* Config status */}
      {!isConfigured && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
          <AlertCircle size={24} className="text-amber-500 shrink-0" />
          <div>
            <p className="font-semibold text-amber-800">Configuration incomplète</p>
            <p className="text-sm text-amber-600">Configurez votre école dans l'onglet « Config » avant de synchroniser</p>
          </div>
        </div>
      )}

      {/* Data summary */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-ci-green to-ci-green-light px-5 py-3">
          <h3 className="font-semibold text-white text-sm">📦 Données prêtes à envoyer</h3>
        </div>
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">École</p>
              <p className="font-semibold text-gray-800">{config.nom_ecole || '—'}</p>
            </div>
            <div>
              <p className="text-gray-500">Secteur</p>
              <p className="font-semibold text-gray-800">{config.secteur_pedagogique || '—'}</p>
            </div>
            <div>
              <p className="text-gray-500">Directeur</p>
              <p className="font-semibold text-gray-800">{config.nom_directeur} {config.prenoms_directeur}</p>
            </div>
            <div>
              <p className="text-gray-500">Nombre d'élèves</p>
              <p className="font-semibold text-gray-800 text-lg">{eleves.length}</p>
            </div>
          </div>

          {eleves.length > 0 && (
            <div className="flex gap-3 pt-2">
              <div className="bg-sky-50 rounded-lg px-3 py-1.5 text-center flex-1">
                <p className="text-lg font-bold text-sky-600">{eleves.filter(e => e.sexe === 'M').length}</p>
                <p className="text-xs text-sky-500">Garçons</p>
              </div>
              <div className="bg-pink-50 rounded-lg px-3 py-1.5 text-center flex-1">
                <p className="text-lg font-bold text-pink-600">{eleves.filter(e => e.sexe === 'F').length}</p>
                <p className="text-xs text-pink-500">Filles</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Export button before sync */}
      {eleves.length > 0 && (
        <button
          onClick={onExport}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 font-semibold rounded-xl border-2 border-ci-green text-ci-green bg-white hover:bg-green-50 transition-all"
        >
          <Download size={20} />
          <span>📥 Exporter une copie locale (Excel)</span>
        </button>
      )}

      {/* Sync button */}
      <button
        onClick={handleSync}
        disabled={!canSync || isSyncing}
        className={`w-full flex items-center justify-center gap-2 px-6 py-4 font-semibold rounded-xl shadow-lg transition-all ${
          canSync && !isSyncing
            ? 'bg-gradient-to-r from-ci-orange to-amber-500 text-white shadow-orange-200 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99]'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
        }`}
      >
        {isSyncing ? (
          <>
            <RefreshCw size={22} className="animate-spin" />
            <span>Envoi en cours...</span>
          </>
        ) : eleves.length === 0 ? (
          <>
            <CloudOff size={22} />
            <span>Aucune donnée à envoyer</span>
          </>
        ) : (
          <>
            <Send size={22} />
            <span>Envoyer {eleves.length} élève(s) au serveur</span>
          </>
        )}
      </button>

      {/* Result feedback */}
      {lastSyncResult && (
        <div className={`flex items-center gap-3 p-4 rounded-xl animate-slide-up ${
          lastSyncResult === 'success'
            ? 'bg-green-50 border border-green-200'
            : 'bg-red-50 border border-red-200'
        }`}>
          {lastSyncResult === 'success' ? (
            <>
              <CheckCircle size={24} className="text-green-500" />
              <div>
                <p className="font-semibold text-green-800">Envoi réussi !</p>
                <p className="text-sm text-green-600">Les données ont été transmises au serveur et supprimées localement.</p>
              </div>
            </>
          ) : (
            <>
              <AlertCircle size={24} className="text-red-500" />
              <div>
                <p className="font-semibold text-red-800">Échec de l'envoi</p>
                <p className="text-sm text-red-600">Vérifiez votre connexion et l'URL du serveur, puis réessayez.</p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
        <h4 className="font-semibold text-blue-800 text-sm mb-2">💡 Comment ça marche ?</h4>
        <ol className="text-sm text-blue-700 space-y-1.5 list-decimal list-inside">
          <li>Configurez votre école dans l'onglet « Config »</li>
          <li>Ajoutez les élèves sans extrait dans l'onglet « Ajouter »</li>
          <li>Les données sont sauvegardées localement (fonctionne hors ligne)</li>
          <li><strong>Exportez une copie locale</strong> pour votre archive personnelle</li>
          <li>Quand vous avez du réseau, cliquez « Envoyer » pour transmettre au serveur</li>
        </ol>
      </div>
    </div>
  );
}
