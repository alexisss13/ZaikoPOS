import { openDB, DBSchema, IDBPDatabase } from 'idb';

// 1. Definición de Tipos para la Venta Offline
// Esto replica lo que tu API espera recibir en /api/sales
export interface OfflineSalePayload {
  items: {
    productId: string;
    quantity: number;
    price: number;
  }[];
  payments: {
    method: 'CASH' | 'YAPE' | 'PLIN' | 'CARD' | 'TRANSFER'; // Hardcoded del enum Prisma para frontend
    amount: number;
    reference?: string;
  }[];
  customerId?: string;
}

// 2. Estructura del objeto guardado en IndexedDB
export interface OfflineSale {
  localId: string;        // UUID generado en el frontend (será el externalId)
  payload: OfflineSalePayload;
  context: {              // Datos vitales para recrear los Headers
    userId: string;
    branchId: string;
  };
  createdAtLocal: number; // Timestamp para ordenar FIFO
  retryCount: number;
  lastError?: string;
}

// 3. Schema de la BD Local
interface ZaikoDB extends DBSchema {
  offline_sales_queue: {
    key: string; // La llave será localId
    value: OfflineSale;
  };
}

const DB_NAME = 'zaiko-offline-db';
const STORE_NAME = 'offline_sales_queue';

// 4. Singleton para conexión a IDB
let dbPromise: Promise<IDBPDatabase<ZaikoDB>>;

const getDB = () => {
  if (typeof window === 'undefined') return null; // Safety check para SSR (Next.js server side)
  
  if (!dbPromise) {
    dbPromise = openDB<ZaikoDB>(DB_NAME, 1, {
      upgrade(db) {
        // Crear el Store si no existe
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'localId' });
        }
      },
    });
  }
  return dbPromise;
};

// ==========================================
// MÉTODOS PÚBLICOS
// ==========================================

export const offlineDB = {
  // Guardar una venta pendiente (Cola)
  addSale: async (sale: OfflineSale) => {
    const db = await getDB();
    if (!db) return;
    return db.put(STORE_NAME, sale);
  },

  // Obtener todas las ventas (para Sync o UI)
  getAllSales: async () => {
    const db = await getDB();
    if (!db) return [];
    // Ordenar manualmente por fecha si IDB no usa cursor, 
    // pero como usaremos FIFO, simplemente traemos todo y ordenamos en memoria (son pocas usualmente)
    const all = await db.getAll(STORE_NAME);
    return all.sort((a, b) => a.createdAtLocal - b.createdAtLocal);
  },

  // Obtener conteo (para Badge en UI)
  getCount: async () => {
    const db = await getDB();
    if (!db) return 0;
    return db.count(STORE_NAME);
  },

  // Eliminar una venta (tras Sync exitoso)
  removeSale: async (localId: string) => {
    const db = await getDB();
    if (!db) return;
    return db.delete(STORE_NAME, localId);
  },

  // Actualizar reintentos o error
  updateSale: async (sale: OfflineSale) => {
    const db = await getDB();
    if (!db) return;
    return db.put(STORE_NAME, sale);
  }
};