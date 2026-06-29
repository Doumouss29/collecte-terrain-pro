import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

const DB_NAME = 'CollecteDB';
const STORE_NAME = 'collectes';

// Service de gestion du stockage hors ligne avec IndexedDB
class OfflineStorageService {
  constructor() {
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'localId', autoIncrement: true });
          store.createIndex('status', 'status', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('serverSynced', 'serverSynced', { unique: false });
        }
      };
    });
  }

  async saveCollecte(data) {
    const collecte = {
      ...data,
      status: 'pending',
      timestamp: new Date().toISOString(),
      serverSynced: false,
      serverId: null
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(collecte);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async updateCollecte(localId, data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const getRequest = store.get(localId);

      getRequest.onsuccess = () => {
        const collecte = getRequest.result;
        const updatedCollecte = {
          ...collecte,
          ...data,
          status: 'pending',
          serverSynced: false
        };
        const updateRequest = store.put(updatedCollecte);
        updateRequest.onerror = () => reject(updateRequest.error);
        updateRequest.onsuccess = () => resolve(updatedCollecte);
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async getCollecte(localId) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(localId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async getAllCollectes() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async getPendingCollectes() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('status');
      const request = index.getAll('pending');

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async markAsSynced(localId, serverId) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const getRequest = store.get(localId);

      getRequest.onsuccess = () => {
        const collecte = getRequest.result;
        collecte.serverSynced = true;
        collecte.serverId = serverId;
        collecte.status = 'synced';
        const updateRequest = store.put(collecte);
        updateRequest.onerror = () => reject(updateRequest.error);
        updateRequest.onsuccess = () => resolve(collecte);
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async deleteCollecte(localId) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(localId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

const offlineStorage = new OfflineStorageService();

// Extraire les champs manquants des messages d'erreur
const extractMissingFields = (errorMsg) => {
  const requiredFields = {
    'commune': 'Commune',
    'type_proprietaire': 'Type de propriétaire',
    'bien_nature_local': 'Nature du local',
    'prop_nom': 'Nom du propriétaire',
    'prop_prenoms': 'Prénoms',
    'societe_raison_sociale': 'Raison sociale'
  };
  
  const missing = [];
  Object.entries(requiredFields).forEach(([field, label]) => {
    if (errorMsg && errorMsg.toLowerCase().includes(field)) {
      missing.push(label);
    }
  });
  return missing;
};

export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        await offlineStorage.init();
        await updatePendingCount();
        setIsReady(true);
      } catch (error) {
        console.error('Offline storage init error:', error);
        setIsReady(true);
      }
    };
    init();
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSyncError(null);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (isOnline && pendingCount > 0 && isReady && !isSyncing) {
      syncCollectes();
    }
  }, [isOnline, pendingCount, isReady, isSyncing]);

  const updatePendingCount = useCallback(async () => {
    try {
      const pending = await offlineStorage.getPendingCollectes();
      setPendingCount(pending.length);
    } catch (error) {
      console.error('Error updating pending count:', error);
    }
  }, []);

  const saveOffline = useCallback(async (data) => {
    try {
      if (!offlineStorage.db) {
        await offlineStorage.init();
      }
      const localId = await offlineStorage.saveCollecte(data);
      await updatePendingCount();
      return { success: true, localId };
    } catch (error) {
      console.error('Error saving offline:', error);
      return { success: false, error };
    }
  }, [updatePendingCount]);

  const updateOffline = useCallback(async (localId, data) => {
    try {
      if (!offlineStorage.db) {
        await offlineStorage.init();
      }
      await offlineStorage.updateCollecte(localId, data);
      await updatePendingCount();
      return { success: true };
    } catch (error) {
      console.error('Error updating offline:', error);
      return { success: false, error };
    }
  }, [updatePendingCount]);

  const syncCollectes = useCallback(async () => {
    if (!isOnline) {
      setSyncError('Pas de connexion internet');
      return { success: false, error: 'Pas de connexion' };
    }

    setIsSyncing(true);
    setSyncError(null);

    try {
      const pending = await offlineStorage.getPendingCollectes();
      let syncedCount = 0;
      const errors = [];

      for (const collecte of pending) {
        try {
          const { localId, status, timestamp, serverSynced, serverId, ...data } = collecte;

          if (serverId) {
            await base44.entities.Collecte.update(serverId, data);
            await offlineStorage.markAsSynced(localId, serverId);
          } else {
            const created = await base44.entities.Collecte.create(data);
            await offlineStorage.markAsSynced(localId, created.id);
          }
          syncedCount++;
        } catch (error) {
          console.error(`Error syncing collecte:`, error);

          const errorMsg = error?.response?.data?.message || error?.message || 'Erreur inconnue';
          const missingFields = extractMissingFields(errorMsg);

          errors.push({
            commune: collecte.commune || 'Sans commune',
            error: missingFields.length > 0 
              ? `Champs manquants: ${missingFields.join(', ')}`
              : errorMsg
          });
        }
      }

      await updatePendingCount();
      setIsSyncing(false);

      if (errors.length > 0) {
        const errorMessage = errors.map(e => `${e.commune}: ${e.error}`).join('\n');
        setSyncError(errorMessage);
      }

      return {
        success: errors.length === 0,
        syncedCount,
        errorCount: errors.length,
        errors,
        message: `${syncedCount} synchronisées${errors.length > 0 ? `, ${errors.length} erreurs` : ''}`
      };
    } catch (error) {
      setSyncError(error.message);
      setIsSyncing(false);
      return { success: false, error };
    }
  }, [isOnline, updatePendingCount]);

  return {
    isOnline,
    pendingCount,
    isSyncing,
    syncError,
    isReady,
    saveOffline,
    updateOffline,
    syncCollectes,
    offlineStorage
  };
};