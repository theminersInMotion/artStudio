/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { detectFiguresFromImage } from './figureDetection.ts';

describe('Figure Detection Suite', () => {
  it('should gracefully handle empty or invalid image elements without crashing', async () => {
    // Mock image element with zero dimensions
    const mockEmptyImg = {
      naturalWidth: 0,
      naturalHeight: 0,
      width: 0,
      height: 0,
    } as unknown as HTMLImageElement;

    const result = await detectFiguresFromImage(mockEmptyImg);
    assert.deepStrictEqual(result, []);
  });
});
