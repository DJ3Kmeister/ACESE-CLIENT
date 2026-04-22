import { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, CheckCircle, Monitor, Smartphone } from 'lucide-react';

interface TutorialOverlayProps {
  onComplete: () => void;
}

interface Step {
  image: string;
  title: string;
  subtitle: string;
  instructions: string[];
  emoji: string;
}

const STEPS: Step[] = [
  {
    image: '/images/tuto-bienvenue.png',
    title: 'Bienvenue sur ACESE !',
    subtitle: 'Application de collecte des élèves sans extrait — IEPP GRABO',
    instructions: [
      'Cette application vous permet d\'enregistrer les élèves qui n\'ont pas d\'extrait de naissance.',
      'Les 5 onglets en bas (mobile) ou en haut (ordinateur) vous guident pas à pas.',
      'Vous ne verrez ce tutoriel qu\'une seule fois.',
    ],
    emoji: '👋',
  },
  {
    image: '/images/tuto-config.png',
    title: '1. Configurez votre école',
    subtitle: 'Onglet ⚙️ Config — À faire en premier !',
    instructions: [
      'Choisissez votre secteur pédagogique dans la liste déroulante.',
      'Sélectionnez ou tapez le nom de votre école.',
      'Entrez votre nom, prénoms et numéro de téléphone (07/05/01).',
      'Les champs grisés (DRENAET, IEPP) sont automatiques — ne les touchez pas.',
      'Appuyez sur « Enregistrer la configuration » en bas.',
    ],
    emoji: '⚙️',
  },
  {
    image: '/images/tuto-ajouter.png',
    title: '2. Ajoutez un élève',
    subtitle: 'Onglet ➕ Ajouter — Un formulaire par élève',
    instructions: [
      'Remplissez le NOM (en majuscules) et les Prénoms de l\'élève.',
      'Choisissez Masculin ou Féminin.',
      'Pour la date : tapez les 8 chiffres (ex: 01062014 → 01/06/2014) ou utilisez le bouton 📅.',
      'Choisissez la classe : CP1, CP2, CE1, CE2, CM1 ou CM2.',
      'Remplissez les infos du père, de la mère et du témoin.',
      'Les numéros doivent commencer par 07, 05 ou 01 et avoir 10 chiffres.',
      'Appuyez sur « Ajouter cet élève » en bas.',
    ],
    emoji: '➕',
  },
  {
    image: '/images/tuto-liste.png',
    title: '3. Consultez votre liste',
    subtitle: 'Onglet 📋 Liste — Tous vos élèves enregistrés',
    instructions: [
      'Tous vos élèves sont classés par classe (CP1, CE1, CM2...).',
      'Utilisez la barre de recherche 🔍 pour retrouver un élève rapidement.',
      'Appuyez sur 👁 pour voir tous les détails d\'un élève.',
      'Appuyez sur 🗑 (deux fois) pour supprimer un élève.',
      'Appuyez sur « Exporter Excel » pour sauvegarder une copie sur votre appareil.',
      'Le bouton « Archiver & vider » exporte PUIS efface tout.',
    ],
    emoji: '📋',
  },
  {
    image: '/images/tuto-stats.png',
    title: '4. Suivez vos statistiques',
    subtitle: 'Onglet 📊 Stats — Voyez vos chiffres en un coup d\'œil',
    instructions: [
      'Le total de vos élèves, le nombre de garçons et de filles.',
      'Un graphique de répartition par sexe.',
      'Un tableau par classe avec le détail garçons/filles.',
      'Un récapitulatif de votre école en bas.',
      'Tout se met à jour automatiquement quand vous ajoutez un élève.',
    ],
    emoji: '📊',
  },
  {
    image: '/images/tuto-export.png',
    title: '5. Exportez votre liste (important !)',
    subtitle: 'Gardez toujours une copie sur votre appareil',
    instructions: [
      'Avant d\'envoyer au serveur, exportez TOUJOURS une copie Excel.',
      'Appuyez sur « Exporter Excel » dans l\'onglet Liste.',
      'Le fichier est nommé avec la date et l\'heure (ex: Liste_Eleves_EPP_GNATO_21-04-2026_14h30.xlsx).',
      'Sur téléphone, vous le retrouverez dans les Téléchargements.',
      'Sur ordinateur, il sera dans votre dossier Téléchargements.',
      'C\'est votre archive personnelle — gardez-la précieusement !',
    ],
    emoji: '💾',
  },
  {
    image: '/images/tuto-sync.png',
    title: '6. Envoyez au serveur',
    subtitle: 'Onglet 🔄 Sync — Transmettez vos données à l\'administration',
    instructions: [
      'Vérifiez que le bandeau vert « Connecté à Internet » est affiché.',
      'Vérifiez le résumé : école, secteur, nombre d\'élèves.',
      'Appuyez sur le gros bouton orange « Envoyer X élève(s) au serveur ».',
      '⚠️ Après l\'envoi, la liste est vidée de votre appareil.',
      '⚠️ Exportez toujours une copie Excel AVANT d\'envoyer !',
    ],
    emoji: '📤',
  },
  {
    image: '/images/tuto-final.png',
    title: 'Vous êtes prêt !',
    subtitle: 'Tout ce que vous devez retenir :',
    instructions: [
      '✅ L\'application fonctionne MÊME SANS INTERNET.',
      '✅ Ajoutez vos élèves hors ligne, envoyez quand vous avez du réseau.',
      '✅ Exportez TOUJOURS une copie Excel avant d\'envoyer.',
      '✅ En cas de bug, le contact support est en bas de chaque page.',
      'Bonne collecte ! 🎓',
    ],
    emoji: '🎉',
  },
];

export function TutorialOverlay({ onComplete }: TutorialOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);

  // Detect screen size
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const step = STEPS[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === STEPS.length - 1;
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-2 md:p-6 animate-fade-in">
      <div className={`bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-slide-up ${
        isDesktop ? 'max-w-4xl w-full max-h-[90vh] flex-row' : 'max-w-md w-full max-h-[95vh]'
      }`}>

        {/* Progress bar (mobile only) */}
        {!isDesktop && (
          <div className="h-1.5 bg-gray-100 shrink-0">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Image section */}
        <div className={`relative shrink-0 bg-gray-100 flex items-center justify-center ${
          isDesktop ? 'w-1/2 p-6' : 'px-4 py-3'
        }`}>
          {/* Device indicator */}
          <div className={`absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium z-10 ${
            isDesktop ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
          }`}>
            {isDesktop ? <Monitor size={12} /> : <Smartphone size={12} />}
            <span>{isDesktop ? 'Version ordinateur' : 'Version mobile'}</span>
          </div>

          {/* Step badge */}
          <div className="absolute top-3 right-3 bg-black/60 text-white text-xs font-bold px-2.5 py-1 rounded-full z-10">
            {currentStep + 1}/{STEPS.length}
          </div>

          <div className={`rounded-xl overflow-hidden border-2 border-gray-300 shadow-md ${
            isDesktop ? 'w-full' : ''
          }`}>
            <img
              src={step.image}
              alt={step.title}
              className={`w-full h-auto object-contain ${
                isDesktop ? 'max-h-[500px]' : 'max-h-[260px]'
              }`}
              loading="lazy"
            />
          </div>

          {/* Desktop progress dots */}
          {isDesktop && (
            <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-1.5">
              {STEPS.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentStep(idx)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    idx === currentStep
                      ? 'bg-green-500 w-6'
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`Aller à l'étape ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Content section */}
        <div className={`flex flex-col ${isDesktop ? 'w-1/2' : 'flex-1'}`}>
          {/* Header */}
          <div className={`px-5 pt-4 pb-2 flex items-center justify-between shrink-0 ${isDesktop ? 'border-b border-gray-100' : ''}`}>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{step.emoji}</span>
              <div>
                <h2 className={`font-bold text-gray-800 ${isDesktop ? 'text-xl' : 'text-lg'}`}>{step.title}</h2>
                <p className={`text-gray-500 ${isDesktop ? 'text-sm' : 'text-xs'}`}>{step.subtitle}</p>
              </div>
            </div>
            {!isLast && (
              <button
                onClick={onComplete}
                className="p-1.5 text-gray-300 hover:text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Instructions */}
          <div className="px-5 py-3 flex-1 overflow-y-auto">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h4 className="font-semibold text-blue-800 text-sm mb-3 flex items-center gap-2">
                <span>📝</span> Ce que vous devez faire :
              </h4>
              <ul className="space-y-2.5">
                {step.instructions.map((instruction, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-sm text-blue-700 leading-relaxed">
                    <span className="w-5 h-5 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center text-xs font-bold mt-0.5 shrink-0">
                      {idx + 1}
                    </span>
                    <span>{instruction}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Navigation */}
          <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 shrink-0">
            <div className="flex items-center justify-between gap-3">
              {!isFirst ? (
                <button
                  onClick={() => setCurrentStep(prev => prev - 1)}
                  className="flex items-center gap-1 px-4 py-2.5 text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <ChevronLeft size={18} />
                  <span className="text-sm font-medium">Retour</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex gap-2">
                {!isLast && (
                  <button
                    onClick={onComplete}
                    className="px-3 py-2.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    Passer ▸
                  </button>
                )}

                {isLast ? (
                  <button
                    onClick={onComplete}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl shadow-lg shadow-green-200 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    <CheckCircle size={20} />
                    <span>J'ai compris, commencer !</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrentStep(prev => prev + 1)}
                    className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl shadow-lg shadow-green-200 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    <span>Suivant</span>
                    <ChevronRight size={18} />
                  </button>
                )}
              </div>
            </div>

            {/* Dots indicator (mobile only) */}
            {!isDesktop && (
              <div className="flex items-center justify-center gap-1.5 mt-3">
                {STEPS.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentStep(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx === currentStep
                        ? 'bg-green-500 w-4'
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                    aria-label={`Aller à l'étape ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
