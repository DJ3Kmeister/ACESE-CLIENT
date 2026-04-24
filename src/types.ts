export interface SchoolConfig {
  drenaet: string;
  iepp: string;
  secteur_pedagogique: string;
  nom_ecole: string;
  nom_directeur: string;
  prenoms_directeur: string;
  contact1: string;
  contact2: string;
  email: string;
  serverUrl: string;
  director_password_hash?: string;
  director_password_salt?: string;
}

export interface Eleve {
  id: string;
  nom: string;
  prenoms: string;
  sexe: 'M' | 'F';
  date_naissance_probable: string;
  classe: string;
  nom_pere: string;
  numero_pere: string;
  nom_mere: string;
  numero_mere: string;
  nom_temoin: string;
  numero_temoin: string;
}

export type TabType = 'config' | 'ajouter' | 'liste' | 'stats' | 'sync';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
}

export interface SecteurInfo {
  id: number;
  nom: string;
  ecoles: { id: number; nom: string }[];
}
