/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AnatomicalCategory = 
  | 'osteologia' 
  | 'miologia' 
  | 'articulacoes' 
  | 'proporcoes' 
  | 'planos_movimentos';

export type BodyRegion = 
  | 'cabeca_pescoco' 
  | 'tronco' 
  | 'membro_superior' 
  | 'membro_inferior' 
  | 'geral';

export interface AnatomicalTerm {
  id: string;
  termEs: string;         // Termo em Espanhol (do livro do Tenten)
  termPt: string;         // Tradução técnica em Português
  termLatin: string;      // Nomenclatura anatômica internacional (Latim)
  category: AnatomicalCategory;
  region: BodyRegion;
  definitionPt: string;   // Explicação clara da função anatômica
  drawingTips: string;    // Dica de desenho artístico no estilo Tenten (marcos, simplificação 3D)
  relevantPages: number[]; // Páginas correspondentes no livro do Tenten (1-537)
  originInsertion?: string; // Origem e inserção muscular para artistas
}

export interface ChapterIndex {
  id: string;
  titlePt: string;
  titleEs: string;
  startPage: number;
  endPage: number;
  description: string;
  keyTerms: string[];
  recommendedPages: number[];
}

export interface ArtBook {
  id: string;
  title: string;
  artist: string;
  totalPages: number;
  description?: string;
  coverImage?: string;
  filename?: string;
  fileSize?: string;
  isCustomUploaded?: boolean;
  uploadedAt?: string;
  language?: string;
  tags?: string[];
  hasPdfOnDisk?: boolean;
}

export interface StylisticAnalysis {
  artistName: string;
  gestureProcess: string;
  volumeForms: string[];
  landmarks: string[];
  muscleFlows: string[];
  contourAndShading: string;
  identifiedTerms: Array<{
    termEs: string;
    termPt: string;
    note: string;
  }>;
  drawingTipsSummary: string;
}

export interface ExerciseStep {
  stepNumber: number;
  title: string;
  instruction: string;
  tip: string;
  durationSeconds?: number;
}

export interface ImageCropBox {
  x: number;      // percentage (0-100) from left
  y: number;      // percentage (0-100) from top
  width: number;  // percentage (0-100) width
  height: number; // percentage (0-100) height
}

export interface Exercise {
  id: string;
  title: string;
  difficulty: 'iniciante' | 'intermediario' | 'avancado';
  category: string;
  durationMinutes: number;
  referenceImage?: string;
  referencePage?: number;
  objectives: string[];
  steps: ExerciseStep[];
  styleFocus: string; // Ex: "Simplificação por Caixas e Cilindros no Estilo Tenten"
  artistId: string;
  illustrationCrop?: ImageCropBox; // Recorte preciso da área de desenho para isolar da página de texto
  detectedImages?: Array<{
    id: string;
    label: string;
    cropBox: ImageCropBox;
  }>;
}

export interface ReferenceItem {
  id: string;
  title: string;
  type: 'pdf_page' | 'uploaded_image';
  pageNumber?: number;
  imageUrl?: string;
  thumbnailUrl?: string;
  artistId: string;
  tags: string[];
  notes?: string;
  addedAt: string;
  analysis?: StylisticAnalysis;
}

export interface ArtistProfile {
  id: string;
  name: string;
  countryOrOrigin?: string;
  description: string;
  styleCharacteristics: string[];
  isDefault?: boolean;
  avatarColor?: string;
  referenceCount?: number;
}

export interface Collection {
  id: string;
  title: string;
  description: string;
  artistId: string;
  tags: string[];
  items: ReferenceItem[];
  createdAt: string;
}

export interface UserDrawingSubmission {
  id: string;
  exerciseId: string;
  exerciseTitle: string;
  drawingDataUrl: string;
  createdAt: string;
  rating?: number; // 1-100
  feedback?: {
    strengths: string[];
    improvements: string[];
    anatomyAccuracy: number; // 0-100
    styleFidelity: number;    // 0-100
    overallComment: string;
  };
}
