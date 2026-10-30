/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatBytes,
  getFileExtension,
  getFileCategory,
  validateFile,
  MAX_FILE_SIZE_BYTES,
  CURRICULUM_WEEKS,
} from './fileValidation.ts';

describe('fileValidation Utilities', () => {
  describe('formatBytes', () => {
    it('formats 0 bytes correctly', () => {
      assert.equal(formatBytes(0), '0 B');
    });

    it('formats kilobyte values', () => {
      assert.equal(formatBytes(1024), '1 KB');
      assert.equal(formatBytes(2048), '2 KB');
    });

    it('formats megabyte values correctly', () => {
      assert.equal(formatBytes(1024 * 1024), '1 MB');
      assert.equal(formatBytes(150 * 1024 * 1024), '150 MB');
      assert.equal(formatBytes(200 * 1024 * 1024), '200 MB');
    });
  });

  describe('getFileExtension & getFileCategory', () => {
    it('extracts extensions case-insensitively', () => {
      assert.equal(getFileExtension('prancha.JPG'), 'jpg');
      assert.equal(getFileExtension('documento.PDF'), 'pdf');
      assert.equal(getFileExtension('foto.HEIC'), 'heic');
      assert.equal(getFileExtension('desenho.webp'), 'webp');
    });

    it('categorizes image and pdf files properly', () => {
      assert.equal(getFileCategory('prancha1.png', 'image/png'), 'image');
      assert.equal(getFileCategory('tenten.heic', 'image/heic'), 'image');
      assert.equal(getFileCategory('apostila.pdf', 'application/pdf'), 'pdf');
      assert.equal(getFileCategory('arquivo.zip', 'application/zip'), 'other');
    });
  });

  describe('validateFile', () => {
    it('accepts files within 200MB with supported format', () => {
      const validJpg = { name: 'exercicio_semana1.jpg', size: 5 * 1024 * 1024, type: 'image/jpeg' };
      const resJpg = validateFile(validJpg);
      assert.equal(resJpg.valid, true);
      assert.equal(resJpg.category, 'image');

      const validPdf = { name: 'apostila_aula.pdf', size: 180 * 1024 * 1024, type: 'application/pdf' };
      const resPdf = validateFile(validPdf);
      assert.equal(resPdf.valid, true);
      assert.equal(resPdf.category, 'pdf');

      const validHeic = { name: 'foto_ipad.heic', size: 12 * 1024 * 1024, type: 'image/heic' };
      assert.equal(validateFile(validHeic).valid, true);

      const validWebp = { name: 'anatomia.webp', size: 2 * 1024 * 1024, type: 'image/webp' };
      assert.equal(validateFile(validWebp).valid, true);
    });

    it('rejects files exceeding 200MB', () => {
      const oversizedFile = {
        name: 'livro_gigante.pdf',
        size: MAX_FILE_SIZE_BYTES + 1024,
        type: 'application/pdf',
      };
      const res = validateFile(oversizedFile);
      assert.equal(res.valid, false);
      assert.match(res.error || '', /200 MB/);
    });

    it('rejects unsupported extensions', () => {
      const unsupported = {
        name: 'virus.exe',
        size: 1024,
        type: 'application/x-msdownload',
      };
      const res = validateFile(unsupported);
      assert.equal(res.valid, false);
      assert.match(res.error || '', /não suportado/);
    });

    it('rejects empty or invalid files', () => {
      const empty = { name: 'vazio.jpg', size: 0, type: 'image/jpeg' };
      assert.equal(validateFile(empty).valid, false);
    });
  });

  describe('CURRICULUM_WEEKS', () => {
    it('contains all 10 weeks sequentially', () => {
      assert.equal(CURRICULUM_WEEKS.length, 10);
      CURRICULUM_WEEKS.forEach((weekPlan, idx) => {
        assert.equal(weekPlan.week, idx + 1);
        assert.ok(weekPlan.title.includes(`Semana ${idx + 1}`));
        assert.ok(weekPlan.focusAreas.length > 0);
      });
    });
  });
});
