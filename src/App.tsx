import { useState, useEffect, useCallback } from 'react';
import {
  Settings, UserPlus, List, BarChart3, RefreshCw,
  GraduationCap, Wifi, WifiOff, Menu, X, Download, AlertTriangle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import type { SchoolConfig, Eleve, TabType, ToastMessage, SecteurInfo } from './types';
import { ConfigPanel } from './components/ConfigPanel';
import { StudentForm } from './components/StudentForm';
import { StudentList } from './components/StudentList';
import { StatsPanel } from './components/StatsPanel';
import { SyncPanel } from './components/SyncPanel';
import { Toast } from './components/Toast';
import { TutorialOverlay } from './components/TutorialOverlay';
import { DirectorLockScreen } from './components/DirectorLockScreen';
import { DirectorLoginScreen } from './components/DirectorLoginScreen';
import { hashPassword, makeSalt } from './utils/password';

const DEFAULT_CONFIG: SchoolConfig = {
  drenaet: 'DRENAET San-Pédro',
  iepp: 'IEPP GRABO',
  secteur_pedagogique: '',
  nom_ecole: '',
  nom_directeur: '',
  prenoms_directeur: '',
  contact1: '',
  contact2: '',
  email: '',
  serverUrl: 'https://acese-server.onrender.com',
};

const DEFAULT_SECTEURS: SecteurInfo[] = [
  { id: 1, nom: 'GRABO EST', ecoles: [] },
  { id: 2, nom: 'GRABO EST 2', ecoles: [] },
  { id: 3, nom: 'GRABO OUEST', ecoles: [] },
  { id: 4, nom: 'GRABO OUEST 2', ecoles: [] },
  { id: 5, nom: 'GNATO', ecoles: [] },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('config');
  const [config, setConfig] = useState<SchoolConfig>(DEFAULT_CONFIG);
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isConfigured, setIsConfigured] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [secteurs, setSecteurs] = useState<SecteurInfo[]>(DEFAULT_SECTEURS);
  const [newVersionAvailable, setNewVersionAvailable] = useState(false);
  const [showTutorial, setShowTutorial] = useState(() => {
    return !localStorage.getItem('acese_tutorial_done');
  });
  const [contactInfo, setContactInfo] = useState<{ contact_whatsapp?: string; contact_email?: string; contact_nom?: string }>({});
  const [showPendingAlert, setShowPendingAlert] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  // Load saved data on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem('acese_config');
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      setConfig(parsed);
      setIsConfigured(true);
    }
    const savedEleves = localStorage.getItem('acese_eleves');
    if (savedEleves) {
      const parsed = JSON.parse(savedEleves);
      setEleves(parsed);
      // Show alert if there are unsent students
      if (Array.isArray(parsed) && parsed.length > 0) {
        setShowPendingAlert(true);
      }
    }
    const savedSecteurs = localStorage.getItem('acese_secteurs');
    if (savedSecteurs) {
      setSecteurs(JSON.parse(savedSecteurs));
    }
  }, []);

  // Detect new version via Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(function(reg) {
        if (reg) {
          reg.addEventListener('updatefound', function() {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', function() {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setNewVersionAvailable(true);
                }
              });
            }
          });
          // Force check for update on load
          reg.update();
        }
      });
    }
  }, []);

  // Fetch contact info from server
  useEffect(() => {
    if (!isOnline) return;
    const fetchContact = async () => {
      try {
        const res = await fetch(`${DEFAULT_CONFIG.serverUrl}/api/config`);
        if (res.ok) {
          const data = await res.json();
          setContactInfo(data);
        }
      } catch { /* ignore */ }
    };
    fetchContact();
  }, [isOnline]);

  // Fetch secteurs from server when online
  useEffect(() => {
    if (!isOnline) return;
    const fetchSecteurs = async () => {
      try {
        const res = await fetch(`${DEFAULT_CONFIG.serverUrl}/api/secteurs`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setSecteurs(data);
            localStorage.setItem('acese_secteurs', JSON.stringify(data));
          }
        }
      } catch {
        // Silently fail, use cached/default secteurs
      }
    };
    fetchSecteurs();
    const interval = setInterval(fetchSecteurs, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isOnline]);

  // Lock app after 1h inactivity when a director password exists
  useEffect(() => {
    if (!config.director_password_hash) {
      setIsLocked(false);
      sessionStorage.removeItem('acese_unlocked');
      return;
    }

    const unlockedFlag = sessionStorage.getItem('acese_unlocked');
    if (!unlockedFlag) {
      setIsLocked(true);
      return;
    }

    let inactivityTimer: number | null = null;

    const startInactivityTimer = () => {
      if (inactivityTimer) window.clearTimeout(inactivityTimer);
      inactivityTimer = window.setTimeout(() => {
        sessionStorage.removeItem('acese_unlocked');
        setIsLocked(true);
      }, 60 * 60 * 1000);
    };

    const onActivity = () => {
      if (!isLocked && sessionStorage.getItem('acese_unlocked')) {
        startInactivityTimer();
      }
    };

    startInactivityTimer();

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(evt => window.addEventListener(evt, onActivity, { passive: true }));

    return () => {
      if (inactivityTimer) window.clearTimeout(inactivityTimer);
      events.forEach(evt => window.removeEventListener(evt, onActivity));
    };
  }, [config.director_password_hash, isLocked]);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Save config to localStorage
  const saveConfig = useCallback((newConfig: SchoolConfig) => {
    setConfig(newConfig);
    localStorage.setItem('acese_config', JSON.stringify(newConfig));
    setIsConfigured(true);
    if (newConfig.director_password_hash) {
      sessionStorage.setItem('acese_unlocked', '1');
      setIsLocked(false);
    }
  }, []);

  // Toast notification (must be first since other callbacks use it)
  const showToast = useCallback((type: ToastMessage['type'], text: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, text }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  // Save students to localStorage
  const saveEleves = useCallback((newEleves: Eleve[]) => {
    setEleves(newEleves);
    localStorage.setItem('acese_eleves', JSON.stringify(newEleves));
  }, []);

  // Add student
  const addEleve = useCallback((eleve: Eleve) => {
    const newEleves = [...eleves, eleve];
    saveEleves(newEleves);
    showToast('success', `Élève ${eleve.nom} ${eleve.prenoms} ajouté avec succès !`);
  }, [eleves, saveEleves, showToast]);

  // Remove student
  const removeEleve = useCallback((id: string) => {
    const newEleves = eleves.filter(e => e.id !== id);
    saveEleves(newEleves);
    showToast('info', 'Élève supprimé');
  }, [eleves, saveEleves, showToast]);

  // Clear all students
  const clearEleves = useCallback(() => {
    saveEleves([]);
    showToast('info', 'Tous les élèves ont été supprimés');
  }, [saveEleves, showToast]);

  // Reset local config only
  const resetLocalConfig = useCallback(() => {
    localStorage.removeItem('acese_config');
    sessionStorage.removeItem('acese_unlocked');
    setConfig(DEFAULT_CONFIG);
    setIsConfigured(false);
    setIsLocked(false);
    showToast('info', 'Configuration locale réinitialisée');
  }, [showToast]);

  const unlockDirector = useCallback(async (password: string): Promise<boolean> => {
    if (!config.director_password_hash || !config.director_password_salt) return true;
    const computed = await hashPassword(password, config.director_password_salt);
    const ok = computed === config.director_password_hash;
    if (ok) {
      sessionStorage.setItem('acese_unlocked', '1');
      setIsLocked(false);
      showToast('success', 'Mot de passe accepté');
      return true;
    }
    return false;
  }, [config.director_password_hash, config.director_password_salt, showToast]);

  const recoverDirector = useCallback(async ({ nom_directeur, contact1, nom_ecole }: { nom_directeur: string; contact1: string; nom_ecole?: string; }) => {
    try {
      const res = await fetch(`${config.serverUrl}/api/director-recover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom_directeur, contact1, nom_ecole }),
      });
      const data = await res.json();
      return { found: !!data.found, message: data.error || data.message };
    } catch {
      return { found: false, message: 'Impossible de joindre le serveur' };
    }
  }, [config.serverUrl]);

  const resetDirectorPassword = useCallback(async (newPassword: string) => {
    const salt = makeSalt();
    const hash = await hashPassword(newPassword, salt);
    const updated = {
      ...config,
      director_password_hash: hash,
      director_password_salt: salt,
    };
    setConfig(updated);
    localStorage.setItem('acese_config', JSON.stringify(updated));
    try {
      await fetch(`${config.serverUrl}/api/director-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom_directeur: updated.nom_directeur,
          prenoms_directeur: updated.prenoms_directeur,
          nom_ecole: updated.nom_ecole,
          secteur_pedagogique: updated.secteur_pedagogique,
          contact1: updated.contact1,
          contact2: updated.contact2,
          email: updated.email,
          password_hash: hash,
          password_salt: salt,
        }),
      });
    } catch {
      // Server sync can be retried later
    }
    sessionStorage.setItem('acese_unlocked', '1');
    setIsLocked(false);
    showToast('success', 'Mot de passe réinitialisé avec succès');
  }, [config, showToast]);

  // Export local Excel (returns filename for archive)
  const doExport = useCallback((students: Eleve[]): string => {
    const rows = students.map((e, idx) => ({
      'N°': idx + 1,
      'Matricule / Identifiant': e.matricule || '',
      'Nom': e.nom,
      'Prénoms': e.prenoms,
      'Sexe': (e.sexe === 'G' || (e.sexe as string) === 'M') ? 'Garçon' : 'Fille',
      'Nationalité': e.nationalite || '',
      'Date Naissance': e.date_naissance_probable,
      'Classe': e.classe,
      'Nom Père': e.nom_pere,
      'N° Père': e.numero_pere,
      'CNI/Pièce Père': e.cni_pere || '',
      'Nom Mère': e.nom_mere,
      'N° Mère': e.numero_mere,
      'CNI/Pièce Mère': e.cni_mere || '',
      'Nom Témoin': e.nom_temoin,
      'N° Témoin': e.numero_temoin,
      'CNI/Pièce Témoin': e.cni_temoin || '',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [
      { wch: 5 }, { wch: 15 }, { wch: 15 }, { wch: 10 },
      { wch: 14 }, { wch: 8 }, { wch: 15 }, { wch: 12 },
      { wch: 15 }, { wch: 12 }, { wch: 16 }, { wch: 15 },
      { wch: 12 }, { wch: 16 }, { wch: 15 }, { wch: 12 }, { wch: 16 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Élèves');

    const now = new Date();
    const dateStr = now.toLocaleDateString('fr-FR').replace(/\//g, '-');
    const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }).replace(':', 'h');
    const schoolName = config.nom_ecole.replace(/[^a-zA-Z0-9]/g, '_') || 'Ecole';
    const fileName = `Liste_Eleves_${schoolName}_${dateStr}_${timeStr}.xlsx`;

    XLSX.writeFile(wb, fileName);
    return fileName;
  }, [config]);

  const exportLocal = useCallback(() => {
    if (eleves.length === 0) {
      showToast('error', 'Aucun élève à exporter');
      return;
    }
    const fileName = doExport(eleves);
    showToast('success', `Fichier "${fileName}" exporté avec succès !`);
  }, [eleves, doExport, showToast]);

  // Archive and clear: export then clear
  const archiveAndClear = useCallback(() => {
    if (eleves.length === 0) return;
    const fileName = doExport(eleves);
    saveEleves([]);
    showToast('success', `Archive "${fileName}" sauvegardée — Liste vidée`);
  }, [eleves, doExport, saveEleves, showToast]);

  // Sync to server
  const syncToServer = useCallback(async (): Promise<boolean> => {
    if (!isConfigured || eleves.length === 0) return false;

    // Check for duplicates on the server before sending
    const duplicatesFound: string[] = [];
    for (const eleve of eleves) {
      try {
        const checkRes = await fetch(`${config.serverUrl}/api/check-duplicate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nom: eleve.nom, prenoms: eleve.prenoms }),
        });
        if (checkRes.ok) {
          const checkData = await checkRes.json();
          if (checkData.found) {
            duplicatesFound.push(`${eleve.nom} ${eleve.prenoms} (déjà à ${checkData.duplicates[0].ecole})`);
          }
        }
      } catch { /* ignore network errors during check */ }
    }

    if (duplicatesFound.length > 0) {
      showToast('error', `⚠️ ${duplicatesFound.length} doublon(s) détecté(s) sur le serveur : ${duplicatesFound.slice(0, 3).join(', ')}${duplicatesFound.length > 3 ? '...' : ''}. Supprimez-les de votre liste.`);
      return false;
    }

    const payload = {
      drenaet: config.drenaet,
      iepp: config.iepp,
      secteur_pedagogique: config.secteur_pedagogique,
      nom_ecole: config.nom_ecole,
      nom_directeur: config.nom_directeur,
      prenoms_directeur: config.prenoms_directeur,
      contact1: config.contact1,
      contact2: config.contact2 || '',
      email: config.email || '',
      eleves: eleves.map(({ id, ...rest }) => rest),
    };

    try {
      const response = await fetch(`${config.serverUrl}/api/eleves`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        showToast('success', `${eleves.length} élève(s) envoyé(s) au serveur avec succès !`);
        saveEleves([]);
        return true;
      } else {
        const data = await response.json();
        showToast('error', `Erreur: ${data.error || 'Échec de l\'envoi'}`);
        return false;
      }
    } catch {
      showToast('error', 'Impossible de joindre le serveur. Vérifiez votre connexion.');
      return false;
    }
  }, [config, eleves, isConfigured, saveEleves, showToast]);

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'config', label: 'Config', icon: <Settings size={20} /> },
    { id: 'ajouter', label: 'Ajouter', icon: <UserPlus size={20} /> },
    { id: 'liste', label: 'Liste', icon: <List size={20} /> },
    { id: 'stats', label: 'Stats', icon: <BarChart3 size={20} /> },
    { id: 'sync', label: eleves.length > 0 ? `Sync (${eleves.length})` : 'Sync', icon: <RefreshCw size={20} /> },
  ];

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setMenuOpen(false);
  };

  const completeTutorial = useCallback(() => {
    localStorage.setItem('acese_tutorial_done', 'true');
    setShowTutorial(false);
  }, []);

  const handleDirectorLoginSuccess = useCallback((loginConfig: SchoolConfig) => {
    const finalConfig = {
      ...DEFAULT_CONFIG,
      ...loginConfig,
      serverUrl: DEFAULT_CONFIG.serverUrl,
    };
    setConfig(finalConfig);
    localStorage.setItem('acese_config', JSON.stringify(finalConfig));
    setIsConfigured(true);
    sessionStorage.setItem('acese_unlocked', '1');
    setIsLocked(false);
    showToast('success', 'Connexion réussie. École configurée automatiquement.');
  }, [showToast]);

  if (!isConfigured) {
    return (
      <DirectorLoginScreen
        serverUrl={DEFAULT_CONFIG.serverUrl}
        isOnline={isOnline}
        onLoginSuccess={handleDirectorLoginSuccess}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-orange-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-ci-green-dark to-ci-green text-white shadow-lg sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl">
                <GraduationCap size={28} />
              </div>
              <div>
                <h1 className="text-lg font-bold leading-tight">ACESE</h1>
                <p className="text-xs text-green-200">IEPP GRABO • DRENAET San-Pédro</p>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              {/* Signature DJ3K */}
              <span className="text-[7px] md:text-[8px] text-white/25 font-light leading-tight text-right max-w-[80px] md:max-w-none">
                WebApp powered by<br />DJ3K S3PH1R0TH
              </span>
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                isOnline ? 'bg-green-400/20 text-green-200' : 'bg-red-400/20 text-red-200'
              }`}>
                {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
                <span className="hidden md:inline">{isOnline ? 'En ligne' : 'Hors ligne'}</span>
              </div>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="md:hidden p-1.5 rounded-lg hover:bg-white/10"
              >
                {menuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>

          {/* School info bar */}
          {isConfigured && (
            <div className="mt-2 text-xs text-green-200 bg-white/10 rounded-lg px-3 py-1.5 flex items-center gap-2 truncate">
              <span className="font-semibold text-white">{config.nom_ecole}</span>
              <span>•</span>
              <span>{config.secteur_pedagogique}</span>
              {eleves.length > 0 && (
                <>
                  <span>•</span>
                  <button
                    onClick={exportLocal}
                    className="flex items-center gap-1 text-green-300 hover:text-white transition-colors"
                  >
                    <Download size={10} />
                    <span>Exporter</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Pending data alert */}
      {showPendingAlert && eleves.length > 0 && (
        <div className="bg-red-50 border-b border-red-200 text-center py-3 px-4 animate-slide-down">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
            <p className="text-sm text-red-700 font-medium flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-500 shrink-0" />
              <span><strong>{eleves.length}</strong> élève(s) enregistré(s) mais <strong>pas encore envoyé(s)</strong> au serveur.</span>
            </p>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => { setShowPendingAlert(false); setActiveTab('sync'); }}
                className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600 transition-colors"
              >
                Envoyer maintenant →
              </button>
              <button
                onClick={() => setShowPendingAlert(false)}
                className="text-red-400 hover:text-red-600 text-lg leading-none"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New version banner */}
      {newVersionAvailable && (
        <div className="bg-amber-500 text-white text-center py-2 px-4 text-sm font-medium flex items-center justify-center gap-3 animate-slide-down">
          <AlertTriangle size={16} />
          <span>Une nouvelle version est disponible !</span>
          <button
            onClick={() => window.location.reload()}
            className="px-3 py-1 bg-white text-amber-600 rounded-md font-bold text-xs hover:bg-amber-50 transition-colors"
          >
            Mettre à jour maintenant
          </button>
        </div>
      )}

      {/* Mobile menu dropdown */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/50 animate-fade-in" onClick={() => setMenuOpen(false)}>
          <div className="bg-white w-64 h-full shadow-xl animate-slide-down" onClick={e => e.stopPropagation()}>
            <div className="p-4 bg-ci-green-dark text-white">
              <h2 className="font-bold text-lg">ACESE Menu</h2>
              <p className="text-xs text-green-300 mt-1">
                {eleves.length} élève(s) enregistré(s)
              </p>
            </div>
            <nav className="p-2">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-ci-green/10 text-ci-green font-semibold'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Desktop tab bar */}
      <div className="hidden md:block bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex gap-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-ci-green text-ci-green'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-6 flex-1">
        <div className="animate-slide-up">
          {activeTab === 'config' && (
            <ConfigPanel
              config={config}
              onSave={saveConfig}
              isConfigured={isConfigured}
              secteurs={secteurs}
              onResetLocalConfig={resetLocalConfig}
            />
          )}
          {activeTab === 'ajouter' && (
            <StudentForm
              onAdd={addEleve}
              isConfigured={isConfigured}
              existingEleves={eleves}
            />
          )}
          {activeTab === 'liste' && (
            <StudentList
              eleves={eleves}
              onRemove={removeEleve}
              onClear={clearEleves}
              config={config}
              onExport={exportLocal}
              onArchiveAndClear={archiveAndClear}
            />
          )}
          {activeTab === 'stats' && (
            <StatsPanel eleves={eleves} config={config} />
          )}
          {activeTab === 'sync' && (
            <SyncPanel
              eleves={eleves}
              config={config}
              isOnline={isOnline}
              isConfigured={isConfigured}
              onSync={syncToServer}
              onExport={exportLocal}
            />
          )}
        </div>
      </main>

      {/* Footer — signature + contact */}
      <footer className="bg-white border-t border-gray-200 py-6 px-4 mb-16 md:mb-0">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          {/* Signature */}
          <div>
            <p className="text-sm font-semibold text-gray-700">
              WebApp powered by <span className="text-ci-green font-bold">DJ3K S3PH1R0TH</span>
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              ACESE IEPP GRABO — DRENAET San-Pédro — Côte d'Ivoire
            </p>
          </div>

          {/* Contact support */}
          {(contactInfo.contact_whatsapp || contactInfo.contact_email) && (
            <div className="inline-flex flex-col items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-xl px-5 py-3">
              <p className="text-xs font-semibold text-amber-800 flex items-center gap-1">
                📞 Besoin d'aide ou un bug ? Contactez :
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-amber-700">
                {contactInfo.contact_nom && (
                  <span className="font-medium">{contactInfo.contact_nom}</span>
                )}
                {contactInfo.contact_whatsapp && (
                  <a
                    href={`https://wa.me/${contactInfo.contact_whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 bg-green-500 text-white px-2.5 py-1 rounded-full hover:bg-green-600 transition-colors font-medium"
                  >
                    💬 WhatsApp
                  </a>
                )}
                {contactInfo.contact_email && (
                  <a
                    href={`mailto:${contactInfo.contact_email}`}
                    className="flex items-center gap-1 bg-blue-500 text-white px-2.5 py-1 rounded-full hover:bg-blue-600 transition-colors font-medium"
                  >
                    ✉️ Email
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </footer>

      {/* Mobile bottom navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
        <div className="flex justify-around">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-ci-green'
                  : 'text-gray-400'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {activeTab === tab.id && (
                <div className="absolute bottom-0 w-8 h-0.5 bg-ci-green rounded-full" />
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Toast notifications */}
      <div className="fixed top-20 right-4 z-50 flex flex-col gap-2">
        {toasts.map(toast => (
          <Toast key={toast.id} message={toast} />
        ))}
      </div>

      {/* Tutorial overlay (first visit only) */}
      {showTutorial && (
        <TutorialOverlay onComplete={completeTutorial} />
      )}

      {/* Director password lock screen */}
      <DirectorLockScreen
        visible={isLocked}
        config={config}
        onUnlock={unlockDirector}
        onRecover={recoverDirector}
        onResetPassword={resetDirectorPassword}
      />
    </div>
  );
}
