/**
 * IndexedDB 图片存储工具
 * 用于分离图片存储与状态存储，解决 localStorage 缓存爆炸问题
 */

const DB_NAME = 'fishTankDB';
const DB_VERSION = 1;
const STORE_NAME = 'images';

let db: IDBDatabase | null = null;

// 初始化数据库
export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Failed to open IndexedDB:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

// 保存图片到 IndexedDB
export const saveImage = async (id: string, imageData: string): Promise<void> => {
  const database = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    const request = store.put({ id, data: imageData, createdAt: Date.now() });
    
    request.onsuccess = () => {
      resolve();
    };
    
    request.onerror = () => {
      console.error('Failed to save image:', request.error);
      reject(request.error);
    };
  });
};

// 从 IndexedDB 获取图片
export const getImage = async (id: string): Promise<string | null> => {
  const database = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    const request = store.get(id);
    
    request.onsuccess = () => {
      const result = request.result;
      resolve(result ? result.data : null);
    };
    
    request.onerror = () => {
      console.error('Failed to get image:', request.error);
      reject(request.error);
    };
  });
};

// 批量获取图片
export const getImages = async (ids: string[]): Promise<Map<string, string>> => {
  const database = await initDB();
  const results = new Map<string, string>();
  
  const transaction = database.transaction([STORE_NAME], 'readonly');
  const store = transaction.objectStore(STORE_NAME);
  
  return new Promise((resolve, reject) => {
    let completed = 0;
    
    ids.forEach(id => {
      const request = store.get(id);
      
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          results.set(id, result.data);
        }
        completed++;
        if (completed === ids.length) {
          resolve(results);
        }
      };
      
      request.onerror = () => {
        completed++;
        if (completed === ids.length) {
          resolve(results);
        }
      };
    });
    
    if (ids.length === 0) {
      resolve(results);
    }
  });
};

// 删除图片
export const deleteImage = async (id: string): Promise<void> => {
  const database = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    const request = store.delete(id);
    
    request.onsuccess = () => {
      resolve();
    };
    
    request.onerror = () => {
      console.error('Failed to delete image:', request.error);
      reject(request.error);
    };
  });
};

// 批量删除图片
export const deleteImages = async (ids: string[]): Promise<void> => {
  const database = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    let completed = 0;
    
    ids.forEach(id => {
      const request = store.delete(id);
      
      request.onsuccess = () => {
        completed++;
        if (completed === ids.length) {
          resolve();
        }
      };
      
      request.onerror = () => {
        completed++;
        if (completed === ids.length) {
          resolve();
        }
      };
    });
    
    if (ids.length === 0) {
      resolve();
    }
  });
};

// 获取数据库大小估算
export const getStorageEstimate = async (): Promise<{ used: number; quota: number }> => {
  if (navigator.storage && navigator.storage.estimate) {
    const estimate = await navigator.storage.estimate();
    return {
      used: estimate.usage || 0,
      quota: estimate.quota || 0
    };
  }
  return { used: 0, quota: 0 };
};

// 清理所有图片
export const clearAllImages = async (): Promise<void> => {
  const database = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    const request = store.clear();
    
    request.onsuccess = () => {
      resolve();
    };
    
    request.onerror = () => {
      console.error('Failed to clear images:', request.error);
      reject(request.error);
    };
  });
};
