// IndexedDB utility for storing images and large data
const DB_NAME = 'emuskin-generator';
const DB_VERSION = 2; // Increment version for thumbstick support
const IMAGE_STORE = 'images';

interface StoredImage {
  id: string;
  projectId: string;
  fileName: string;
  data: Blob;
  url: string;
  timestamp: number;
  imageType: 'background' | 'thumbstick';
  controlId?: string; // For thumbstick images
}

class IndexedDBManager {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create image store if it doesn't exist
        if (!db.objectStoreNames.contains(IMAGE_STORE)) {
          const imageStore = db.createObjectStore(IMAGE_STORE, { keyPath: 'id' });
          imageStore.createIndex('projectId', 'projectId', { unique: false });
          imageStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  async storeImage(projectId: string, file: File, imageType: 'background' | 'thumbstick' = 'background', controlId?: string): Promise<string> {
    if (!this.db) await this.init();
    
    const id = controlId 
      ? `${projectId}_thumbstick_${controlId}_${Date.now()}`
      : `${projectId}_${imageType}_${Date.now()}`;
    const url = URL.createObjectURL(file);
    
    const transaction = this.db!.transaction([IMAGE_STORE], 'readwrite');
    const store = transaction.objectStore(IMAGE_STORE);
    
    const imageData: StoredImage = {
      id,
      projectId,
      fileName: file.name,
      data: file,
      url,
      timestamp: Date.now(),
      imageType,
      controlId
    };
    
    return new Promise((resolve, reject) => {
      const request = store.put(imageData);
      request.onsuccess = () => resolve(url);
      request.onerror = () => reject(request.error);
    });
  }

  async getImage(projectId: string, imageType: 'background' | 'thumbstick' = 'background', controlId?: string): Promise<StoredImage | null> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction([IMAGE_STORE], 'readonly');
    const store = transaction.objectStore(IMAGE_STORE);
    const index = store.index('projectId');
    
    return new Promise((resolve, reject) => {
      const request = index.openCursor(IDBKeyRange.only(projectId), 'prev');
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          const image = cursor.value as StoredImage;
          // Check if this is the image we're looking for
          if (image.imageType === imageType && 
              (imageType === 'background' || image.controlId === controlId)) {
            // Recreate object URL if needed
            if (!image.url || image.url.startsWith('blob:')) {
              image.url = URL.createObjectURL(image.data);
            }
            resolve(image);
          } else {
            cursor.continue();
          }
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }
  
  async getAllThumbstickImages(projectId: string): Promise<StoredImage[]> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction([IMAGE_STORE], 'readonly');
    const store = transaction.objectStore(IMAGE_STORE);
    const index = store.index('projectId');
    
    const images: StoredImage[] = [];
    
    return new Promise((resolve, reject) => {
      const request = index.openCursor(IDBKeyRange.only(projectId));
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          const image = cursor.value as StoredImage;
          if (image.imageType === 'thumbstick') {
            // Recreate object URL if needed
            if (!image.url || image.url.startsWith('blob:')) {
              image.url = URL.createObjectURL(image.data);
            }
            images.push(image);
          }
          cursor.continue();
        } else {
          resolve(images);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteProjectImages(projectId: string): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction([IMAGE_STORE], 'readwrite');
    const store = transaction.objectStore(IMAGE_STORE);
    const index = store.index('projectId');
    
    return new Promise((resolve, reject) => {
      const request = index.openCursor(IDBKeyRange.only(projectId));
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          // Revoke object URL to free memory
          const image = cursor.value as StoredImage;
          if (image.url && image.url.startsWith('blob:')) {
            URL.revokeObjectURL(image.url);
          }
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clearOldImages(daysToKeep: number = 7): Promise<void> {
    if (!this.db) await this.init();
    
    const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
    const transaction = this.db!.transaction([IMAGE_STORE], 'readwrite');
    const store = transaction.objectStore(IMAGE_STORE);
    const index = store.index('timestamp');
    
    return new Promise((resolve, reject) => {
      const request = index.openCursor(IDBKeyRange.upperBound(cutoffTime));
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          const image = cursor.value as StoredImage;
          if (image.url && image.url.startsWith('blob:')) {
            URL.revokeObjectURL(image.url);
          }
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });
  }
}

export const indexedDBManager = new IndexedDBManager();
export type { StoredImage };