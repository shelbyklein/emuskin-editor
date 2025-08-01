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
    
    // Extract base projectId without orientation suffix for indexing
    const baseProjectId = projectId.replace(/-(portrait|landscape)$/, '');
    const orientationMatch = projectId.match(/-(portrait|landscape)$/);
    const orientation = orientationMatch ? orientationMatch[1] : '';
    
    // Create ID without duplicating orientation
    const id = controlId 
      ? `${baseProjectId}_thumbstick_${controlId}_${Date.now()}`
      : orientation 
        ? `${baseProjectId}_${imageType}_${orientation}_${Date.now()}`
        : `${baseProjectId}_${imageType}_${Date.now()}`;
    const url = URL.createObjectURL(file);
    
    const transaction = this.db!.transaction([IMAGE_STORE], 'readwrite');
    const store = transaction.objectStore(IMAGE_STORE);
    
    const imageData: StoredImage = {
      id,
      projectId: baseProjectId, // Store with base projectId for easier querying
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
      // For background images, we need to handle the orientation suffix
      // The projectId might be "projectId-portrait" or "projectId-landscape"
      const baseProjectId = projectId.replace(/-(portrait|landscape)$/, '');
      console.log('getImage: Looking for image with projectId:', projectId, 'baseProjectId:', baseProjectId);
      const request = index.openCursor(IDBKeyRange.only(baseProjectId), 'prev');
      
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          const image = cursor.value as StoredImage;
          console.log('Found image in IndexedDB:', image.id, 'type:', image.imageType);
          // Check if this is the image we're looking for
          if (image.imageType === imageType && 
              (imageType === 'background' || image.controlId === controlId)) {
            // For background images, check if the id contains the orientation
            if (imageType === 'background') {
              const orientationMatch = projectId.match(/-(portrait|landscape)$/);
              if (orientationMatch) {
                const orientation = orientationMatch[1];
                // Check if this image id contains the orientation
                // The ID format is: projectId_background_orientation_timestamp
                const idParts = image.id.split('_');
                const imageOrientation = idParts.length >= 3 ? idParts[2] : '';
                if (imageOrientation !== orientation) {
                  console.log('Skipping image - orientation mismatch:', image.id, 'looking for:', orientation, 'found:', imageOrientation);
                  cursor.continue();
                  return;
                }
              }
            }
            // Always create a fresh blob URL since they expire
            console.log('Creating fresh blob URL for image:', image.fileName);
            image.url = URL.createObjectURL(image.data);
            console.log('Returning image:', image.fileName, 'url:', image.url);
            resolve(image);
          } else {
            cursor.continue();
          }
        } else {
          console.log('No image found in IndexedDB for projectId:', projectId);
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
            // Always create a fresh blob URL since they expire
            image.url = URL.createObjectURL(image.data);
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