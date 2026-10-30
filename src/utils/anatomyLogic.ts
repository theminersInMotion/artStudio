/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AnatomicalTerm, AnatomicalCategory, BodyRegion } from '../types/anatomy.ts';

/**
 * Normaliza strings para busca sem acentos e minúsculas
 */
export function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Filtra e ranqueia termos anatômicos com base em termo de busca, categoria e região
 */
export function searchGlossaryTerms(
  terms: AnatomicalTerm[],
  query: string,
  filters?: {
    category?: AnatomicalCategory | 'all';
    region?: BodyRegion | 'all';
    pageNumber?: number;
  }
): AnatomicalTerm[] {
  const normQuery = normalizeText(query);

  return terms.filter(item => {
    // Filtro por categoria
    if (filters?.category && filters.category !== 'all' && item.category !== filters.category) {
      return false;
    }

    // Filtro por região
    if (filters?.region && filters.region !== 'all' && item.region !== filters.region) {
      return false;
    }

    // Filtro por página do livro
    if (filters?.pageNumber && !item.relevantPages.includes(filters.pageNumber)) {
      return false;
    }

    if (!normQuery) return true;

    const normEs = normalizeText(item.termEs);
    const normPt = normalizeText(item.termPt);
    const normLatin = normalizeText(item.termLatin);
    const normDef = normalizeText(item.definitionPt);
    const normTips = normalizeText(item.drawingTips);

    return (
      normEs.includes(normQuery) ||
      normPt.includes(normQuery) ||
      normLatin.includes(normQuery) ||
      normDef.includes(normQuery) ||
      normTips.includes(normQuery)
    );
  }).sort((a, b) => {
    if (!normQuery) return a.termEs.localeCompare(b.termEs);

    // Prioridade para correspondência exata ou inicial nos termos principais
    const aEs = normalizeText(a.termEs);
    const bEs = normalizeText(b.termEs);
    const aPt = normalizeText(a.termPt);
    const bPt = normalizeText(b.termPt);

    const aExact = aEs === normQuery || aPt === normQuery;
    const bExact = bEs === normQuery || bPt === normQuery;
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;

    const aStarts = aEs.startsWith(normQuery) || aPt.startsWith(normQuery);
    const bStarts = bEs.startsWith(normQuery) || bPt.startsWith(normQuery);
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;

    return a.termPt.localeCompare(b.termPt);
  });
}

/**
 * Traduz automaticamente texto anatômico em Espanhol para Português,
 * identificando e anotando termos técnicos do vocabulário do Tenten.
 */
export function translateAnatomySnippet(
  spanishText: string,
  glossary: AnatomicalTerm[]
): {
  translatedText: string;
  matchedTerms: Array<{ termEs: string; termPt: string; definitionPt: string; drawingTips: string }>;
} {
  if (!spanishText) {
    return { translatedText: '', matchedTerms: [] };
  }

  const matchedTerms: Array<{ termEs: string; termPt: string; definitionPt: string; drawingTips: string }> = [];
  let workingText = spanishText;

  // Ordena por comprimento decrescente para não substituir substrings de termos compostos
  const sortedTerms = [...glossary].sort((a, b) => b.termEs.length - a.termEs.length);

  for (const term of sortedTerms) {
    const rawEs = term.termEs.split('/')[0].trim();
    const regex = new RegExp(`\\b${rawEs}\\b`, 'gi');
    if (regex.test(workingText)) {
      matchedTerms.push({
        termEs: term.termEs,
        termPt: term.termPt,
        definitionPt: term.definitionPt,
        drawingTips: term.drawingTips
      });
      // Substitui preservando primeira maiúscula se aplicável
      workingText = workingText.replace(regex, (match) => {
        const isUpper = match[0] === match[0].toUpperCase();
        const pt = term.termPt.split('/')[0].trim();
        return isUpper ? pt.charAt(0).toUpperCase() + pt.slice(1) : pt.toLowerCase();
      });
    }
  }

  // Traduções contextuais de conectivos comuns de anatomia artística espanhol -> português
  const grammarMap: Array<[RegExp, string]> = [
    [/\bel hueso\b/gi, 'o osso'],
    [/\blos huesos\b/gi, 'os ossos'],
    [/\bel músculo\b/gi, 'o músculo'],
    [/\blos músculos\b/gi, 'os músculos'],
    [/\bla cabeza\b/gi, 'a cabeça'],
    [/\blas cabezas\b/gi, 'as cabeças'],
    [/\bel cuello\b/gi, 'o pescoço'],
    [/\bla espalda\b/gi, 'as costas'],
    [/\bla pierna\b/gi, 'a perna'],
    [/\bel brazo\b/gi, 'o braço'],
    [/\bla mano\b/gi, 'a mão'],
    [/\bel pie\b/gi, 'o pé'],
    [/\blos dedos\b/gi, 'os dedos'],
    [/\bcostillas\b/gi, 'costelas'],
    [/\bclavícula\b/gi, 'clavícula'],
    [/\bancho\b/gi, 'largo'],
    [/\bmayor\b/gi, 'maior'],
    [/\bmenor\b/gi, 'menor'],
    [/\binferior\b/gi, 'inferior'],
    [/\bsuperior\b/gi, 'superior'],
    [/\bvista anterior\b/gi, 'vista anterior (frente)'],
    [/\bvista posterior\b/gi, 'vista posterior (costas)'],
    [/\bvista lateral\b/gi, 'vista lateral (perfil)'],
    [/\ben escorzo\b/gi, 'em escorço (perspectiva extrema)']
  ];

  for (const [pattern, replacement] of grammarMap) {
    workingText = workingText.replace(pattern, replacement);
  }

  return {
    translatedText: workingText,
    matchedTerms
  };
}

/**
 * Cálculo de traço para stylus / S-Pen com sensibilidade de pressão e curva dinâmica
 */
export function calculateStylusStroke(
  baseSize: number,
  pressure: number, // 0.0 a 1.0 (ou 0.5 se mouse)
  curve: 'linear' | 'sensitive' | 'firm' = 'sensitive'
): {
  strokeWidth: number;
  strokeOpacity: number;
} {
  // Limita pressão entre 0.05 e 1.0
  const clampedPressure = Math.max(0.05, Math.min(1.0, pressure > 0 ? pressure : 0.5));
  let modifiedPressure = clampedPressure;

  if (curve === 'sensitive') {
    // Curva cúbica suave para resposta ultra rápida em toques leves (estilo S-Pen)
    modifiedPressure = Math.pow(clampedPressure, 0.75);
  } else if (curve === 'firm') {
    // Requer maior pressão física para atingir traço espesso
    modifiedPressure = Math.pow(clampedPressure, 1.4);
  }

  const minWidth = Math.max(1, baseSize * 0.2);
  const strokeWidth = minWidth + (baseSize - minWidth) * modifiedPressure;
  const strokeOpacity = Math.min(1.0, 0.35 + 0.65 * modifiedPressure);

  return {
    strokeWidth: Number(strokeWidth.toFixed(2)),
    strokeOpacity: Number(strokeOpacity.toFixed(2))
  };
}

/**
 * Ponto médio quadrático para suavização de linhas da stylus (Bezier curve interpolation)
 */
export function getQuadraticMidPoint(
  p1: { x: number; y: number },
  p2: { x: number; y: number }
): { x: number; y: number } {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2
  };
}

/**
 * Avaliação pura de métricas de exercício
 */
export function computeExerciseScore(metrics: {
  strokesCount: number;
  timeSpentSeconds: number;
  targetDurationSeconds: number;
  hasStructureLayer: boolean;
  hasInkLayer: boolean;
}): {
  score: number;
  status: 'excelente' | 'muito_bom' | 'em_progresso';
  feedbackNotes: string[];
} {
  let score = 50;
  const feedbackNotes: string[] = [];

  // Avaliação de camadas (construção metodológica do Tenten)
  if (metrics.hasStructureLayer && metrics.hasInkLayer) {
    score += 25;
    feedbackNotes.push('Excelente uso do processo em etapas: camada de esboço/estrutura seguida de arte-final limpa.');
  } else if (metrics.hasStructureLayer) {
    score += 15;
    feedbackNotes.push('Boa fase de construção preliminar. Conclua com traço de linha de contorno definitivo.');
  } else {
    feedbackNotes.push('Dica do Tenten: use a camada azul para construir caixas e ovóides antes do traço final.');
  }

  // Volume de traços
  if (metrics.strokesCount >= 20 && metrics.strokesCount <= 400) {
    score += 15;
    feedbackNotes.push('Economia de linhas eficiente, evitando traço "peludo" ou inseguro.');
  } else if (metrics.strokesCount < 20) {
    score += 5;
    feedbackNotes.push('Adicione mais detalhes de marcos ósseos ou hachuras volumétricas.');
  }

  // Ritmo de tempo
  const timeRatio = metrics.timeSpentSeconds / Math.max(30, metrics.targetDurationSeconds);
  if (timeRatio >= 0.5) {
    score += 10;
    feedbackNotes.push('Tempo de observação e execução adequado.');
  }

  const finalScore = Math.min(100, Math.max(10, score));
  const status = finalScore >= 85 ? 'excelente' : finalScore >= 70 ? 'muito_bom' : 'em_progresso';

  return {
    score: finalScore,
    status,
    feedbackNotes
  };
}
