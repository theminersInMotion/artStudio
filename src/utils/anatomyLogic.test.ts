/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeText,
  searchGlossaryTerms,
  translateAnatomySnippet,
  calculateStylusStroke,
  getQuadraticMidPoint,
  computeExerciseScore
} from './anatomyLogic.ts';
import { ANATOMY_GLOSSARY } from '../data/anatomyGlossary.ts';

test('normalizeText strips accents and converts to lowercase', () => {
  assert.equal(normalizeText('Esternocleidomastóideo'), 'esternocleidomastoideo');
  assert.equal(normalizeText('   Cuádriceps   '), 'cuadriceps');
  assert.equal(normalizeText(''), '');
});

test('searchGlossaryTerms finds terms by Spanish, Portuguese or Latin name', () => {
  const resultsEs = searchGlossaryTerms(ANATOMY_GLOSSARY, 'pectoral');
  assert.ok(resultsEs.length > 0);
  assert.equal(resultsEs[0].id, 'pectoral_mayor');

  const resultsPt = searchGlossaryTerms(ANATOMY_GLOSSARY, 'deltoide');
  assert.ok(resultsPt.length > 0);
  assert.equal(resultsPt[0].id, 'deltoides');

  // Filter by category
  const osteoResults = searchGlossaryTerms(ANATOMY_GLOSSARY, '', { category: 'osteologia' });
  assert.ok(osteoResults.every(r => r.category === 'osteologia'));
  assert.ok(osteoResults.some(r => r.id === 'escapula'));
});

test('translateAnatomySnippet translates technical terms and grammar from Spanish to Portuguese', () => {
  const spanish = 'El músculo esternocleidomastoideo y el pectoral mayor en vista anterior';
  const result = translateAnatomySnippet(spanish, ANATOMY_GLOSSARY);

  assert.ok(result.translatedText.includes('Esternocleidomastóideo') || result.translatedText.includes('esternocleidomastóideo'));
  assert.ok(result.translatedText.includes('peitoral maior') || result.translatedText.includes('Peitoral maior'));
  assert.ok(result.translatedText.includes('o músculo'));
  assert.ok(result.matchedTerms.length >= 2);
});

test('calculateStylusStroke computes width and opacity based on S-Pen / stylus pressure', () => {
  // Light touch (0.2 pressure)
  const light = calculateStylusStroke(10, 0.2, 'sensitive');
  // Firm touch (0.9 pressure)
  const firm = calculateStylusStroke(10, 0.9, 'sensitive');

  assert.ok(light.strokeWidth < firm.strokeWidth, 'Firm stroke must be thicker than light stroke');
  assert.ok(light.strokeOpacity <= firm.strokeOpacity, 'Firm stroke must have equal or higher opacity');
});

test('getQuadraticMidPoint finds center between two coordinates for Bezier curve smoothing', () => {
  const p1 = { x: 10, y: 20 };
  const p2 = { x: 30, y: 40 };
  const mid = getQuadraticMidPoint(p1, p2);
  assert.deepEqual(mid, { x: 20, y: 30 });
});

test('computeExerciseScore evaluates student drawing process based on layers and strokes', () => {
  const full = computeExerciseScore({
    strokesCount: 150,
    timeSpentSeconds: 300,
    targetDurationSeconds: 600,
    hasStructureLayer: true,
    hasInkLayer: true
  });
  assert.ok(full.score >= 80);
  assert.equal(full.status, 'excelente');

  const minimal = computeExerciseScore({
    strokesCount: 5,
    timeSpentSeconds: 20,
    targetDurationSeconds: 600,
    hasStructureLayer: false,
    hasInkLayer: false
  });
  assert.ok(minimal.score < 70);
});
