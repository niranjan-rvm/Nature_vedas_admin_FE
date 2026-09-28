/**
 * Persistent Browser Image Store using IndexedDB (with LocalStorage fallback).
 * 
 * Why IndexedDB?
 * - LocalStorage has a strict 5MB quota across the entire origin and will throw QuotaExceededError
 *   when storing large or multiple uploaded images.
 * - IndexedDB provides virtually unlimited browser storage (>500MB+), enabling 10MB images
 *   to safely persist across page refreshes (F5), browser restarts, and tab closures,
 *   even if the backend database VARCHAR column truncates or rejects large base64 strings.
 */

const DB_NAME = 'nature_vedas_media_db';
const DB_VERSION = 1;
const STORE_NAME = 'entity_images';

interface StoredImageRecord {
  key: string; // e.g. "product_1", "blog_2", "product_slug"
  type: 'product' | 'blog';
  id: string;
  image: string;
  updatedAt: number;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported in this environment'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        store.createIndex('type', 'type', { unique: false });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB'));
  });
}

export const imageStorage = {
  /**
   * Save an uploaded image for a product or blog.
   */
  async saveImage(type: 'product' | 'blog', id: number | string, image: string): Promise<void> {
    if (!id || !image) return;
    const strId = String(id);
    const key = `${type}_${strId}`;

    try {
      const db = await openDatabase();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const record: StoredImageRecord = {
          key,
          type,
          id: strId,
          image,
          updatedAt: Date.now(),
        };
        const req = store.put(record);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // Fallback to localStorage if IndexedDB is blocked in private browsing
      try {
        localStorage.setItem(`nv_img_${key}`, image);
      } catch {
        // storage quota exceeded, ignore
      }
    }
  },

  /**
   * Retrieve an image for a specific entity.
   */
  async getImage(type: 'product' | 'blog', id: number | string): Promise<string | null> {
    if (!id) return null;
    const strId = String(id);
    const key = `${type}_${strId}`;

    try {
      const db = await openDatabase();
      return await new Promise<string | null>((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(key);
        req.onsuccess = () => {
          const result = req.result as StoredImageRecord | undefined;
          resolve(result?.image || null);
        };
        req.onerror = () => resolve(null);
      });
    } catch {
      try {
        return localStorage.getItem(`nv_img_${key}`);
      } catch {
        return null;
      }
    }
  },

  /**
   * Get all images for a specific type ('product' or 'blog') as a map: { [id]: imageUrl }
   */
  async getAllImages(type: 'product' | 'blog'): Promise<Record<string, string>> {
    const map: Record<string, string> = {};

    // 1. Load from IndexedDB
    try {
      const db = await openDatabase();
      await new Promise<void>((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.openCursor();

        req.onsuccess = (e) => {
          const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
          if (cursor) {
            const val = cursor.value as StoredImageRecord;
            if (val.type === type && val.id && val.image) {
              map[val.id] = val.image;
            }
            cursor.continue();
          } else {
            resolve();
          }
        };

        req.onerror = () => resolve();
      });
    } catch {
      // Ignore IDB failure
    }

    // 2. Check localStorage fallback keys
    try {
      const prefix = `nv_img_${type}_`;
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(prefix)) {
          const id = k.replace(prefix, '');
          const val = localStorage.getItem(k);
          if (id && val && !map[id]) {
            map[id] = val;
          }
        }
      }
    } catch {
      // Ignore
    }

    return map;
  },

  /**
   * Delete an image from storage
   */
  async deleteImage(type: 'product' | 'blog', id: number | string): Promise<void> {
    if (!id) return;
    const strId = String(id);
    const key = `${type}_${strId}`;

    try {
      const db = await openDatabase();
      await new Promise<void>((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(key);
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      });
    } catch {
      // Ignore
    }

    try {
      localStorage.removeItem(`nv_img_${key}`);
    } catch {
      // Ignore
    }
  },
};

const LEGACY_ASSET_MAP: Record<string, string> = {
  neem: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80',
  kumkumadi: 'https://images.unsplash.com/photo-1608248597359-2e18195e2820?auto=format&fit=crop&w=600&q=80',
  brahmi: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80',
  chyawanprash: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
  ashwagandha: 'https://images.unsplash.com/photo-1512290900672-1f55b9e078c5?auto=format&fit=crop&w=600&q=80',
  shampoo: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=600&q=80',
};

/**
 * Resolves product image to a valid display URL, handling base64 data URLs,
 * server URLs, relative paths, and legacy asset paths cleanly.
 */
export function resolveProductImageUrl(image?: string | null): string {
  if (!image) {
    return 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=300&q=80';
  }

  if (image.startsWith('http') || image.startsWith('data:') || image.startsWith('blob:')) {
    return image;
  }

  const lower = image.toLowerCase();
  for (const [keyword, url] of Object.entries(LEGACY_ASSET_MAP)) {
    if (lower.includes(keyword)) {
      return url;
    }
  }

  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  return `${apiBase}${image.startsWith('/') ? '' : '/'}${image}`;
}
