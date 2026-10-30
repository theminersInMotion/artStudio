/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getFileCategory } from './fileValidation.ts';

export interface WeeklyUploadRecord {
  id: string;
  week: number;
  fileName: string;
  fileSize: number;
  fileType: string;
  category: 'image' | 'pdf' | 'other';
  createdAt: number;
  notes?: string;
  blob?: Blob;
  previewUrl?: string;
}

const DB_NAME = 'TentenWeeklyLessonsDB';
const DB_VERSION = 1;
const STORE_NAME = 'uploads';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB não está disponível no ambiente atual.'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('week', 'week', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save a user uploaded file to IndexedDB.
 */
export async function saveUpload(
  week: number,
  file: File,
  notes = ''
): Promise<WeeklyUploadRecord> {
  const db = await openDB();
  const id = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const category = getFileCategory(file.name, file.type);

  const record: WeeklyUploadRecord = {
    id,
    week,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type || 'application/octet-stream',
    category,
    createdAt: Date.now(),
    notes,
    blob: file,
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.add(record);

    request.onsuccess = () => {
      // Create memory object URL for instant UI rendering
      const recordWithPreview: WeeklyUploadRecord = {
        ...record,
        previewUrl: URL.createObjectURL(file),
      };
      resolve(recordWithPreview);
    };

    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all uploads for a specific week or all weeks.
 */
export async function getUploads(week?: number): Promise<WeeklyUploadRecord[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);

      let request: IDBRequest;
      if (typeof week === 'number' && week > 0) {
        const index = store.index('week');
        request = index.getAll(week);
      } else {
        request = store.getAll();
      }

      request.onsuccess = () => {
        const records: WeeklyUploadRecord[] = (request.result || []).map((rec: any) => {
          let previewUrl: string | undefined;
          if (rec.blob) {
            try {
              previewUrl = URL.createObjectURL(rec.blob);
            } catch {
              // Ignore preview generation error
            }
          }
          return {
            ...rec,
            previewUrl,
          };
        });
        // Sort descending by date
        records.sort((a, b) => b.createdAt - a.createdAt);
        resolve(records);
      };

      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Erro ao carregar uploads do IndexedDB:', err);
    return [];
  }
}

/**
 * Delete an uploaded file by ID.
 */
export async function deleteUpload(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
