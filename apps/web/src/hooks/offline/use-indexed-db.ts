import { useEffect, useRef, useCallback, useState } from 'react';
import { createLogger } from '@/lib/logger';
import type { QueuedOperation } from './use-offline-queue';

const logger = createLogger('indexed-db');
const DB_NAME = 'petspark-offline';
const DB_VERSION = 2;
const STORE_NAME = 'operations';

export function useIndexedDB(enabled: boolean) {
  const dbRef = useRef<IDBDatabase | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      logger.error('Failed to open IndexedDB', request.error);
    };

    request.onsuccess = () => {
      dbRef.current = request.result;
      setIsReady(true);
      logger.debug('IndexedDB opened successfully');
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('priority', 'priority', { unique: false });
        store.createIndex('batchId', 'batchId', { unique: false });
        store.createIndex('version', 'version', { unique: false });
      } else {
        const transaction = (event.target as IDBOpenDBRequest).transaction;
        if (transaction) {
          const store = transaction.objectStore(STORE_NAME);
          if (!store.indexNames.contains('priority')) {
            store.createIndex('priority', 'priority', { unique: false });
          }
          if (!store.indexNames.contains('batchId')) {
            store.createIndex('batchId', 'batchId', { unique: false });
          }
          if (!store.indexNames.contains('version')) {
            store.createIndex('version', 'version', { unique: false });
          }
        }
      }
    };

    return () => {
      if (dbRef.current) {
        dbRef.current.close();
        dbRef.current = null;
        setIsReady(false);
      }
    };
  }, [enabled]);

  const loadQueue = useCallback(async (): Promise<QueuedOperation[]> => {
    if (!dbRef.current) return [];
    return new Promise((resolve, reject) => {
      const transaction = dbRef.current!.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result as QueuedOperation[]);
      request.onerror = () => reject(request.error ?? new Error('Unknown IndexedDB error'));
    });
  }, []);

  const persistOperation = useCallback(
    async (operation: QueuedOperation) => {
      if (!enabled || !dbRef.current) return;
      return new Promise<void>((resolve, reject) => {
        try {
          const transaction = dbRef.current!.transaction(STORE_NAME, 'readwrite');
          const store = transaction.objectStore(STORE_NAME);
          const request = store.put(operation);

          transaction.oncomplete = () => resolve();
          transaction.onerror = () => reject(transaction.error ?? new Error('Transaction failed'));
          request.onerror = () => reject(request.error ?? new Error('Put operation failed'));
        } catch (error) {
          logger.error('Error persisting operation', error);
          reject(error instanceof Error ? error : new Error(String(error)));
        }
      });
    },
    [enabled]
  );

  const removeOperation = useCallback(
    async (id: string) => {
      if (!enabled || !dbRef.current) return;
      return new Promise<void>((resolve, reject) => {
        try {
          const transaction = dbRef.current!.transaction(STORE_NAME, 'readwrite');
          const store = transaction.objectStore(STORE_NAME);
          const request = store.delete(id);

          transaction.oncomplete = () => resolve();
          transaction.onerror = () => reject(transaction.error ?? new Error('Transaction failed'));
          request.onerror = () => reject(request.error ?? new Error('Delete operation failed'));
        } catch (error) {
          logger.error('Error removing operation', error);
          reject(error instanceof Error ? error : new Error(String(error)));
        }
      });
    },
    [enabled]
  );

  const clearStore = useCallback(async () => {
    if (!enabled || !dbRef.current) return;
    return new Promise<void>((resolve, reject) => {
      try {
        const transaction = dbRef.current!.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error ?? new Error('Transaction failed'));
        request.onerror = () => reject(request.error ?? new Error('Clear operation failed'));
      } catch (error) {
        logger.error('Error clearing store', error);
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }, [enabled]);

  return { isReady, loadQueue, persistOperation, removeOperation, clearStore };
}
