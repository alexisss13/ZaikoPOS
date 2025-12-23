import { openDB, DBSchema } from 'idb';
import { UIProduct } from '@/types/product'; // Asegúrate de tener este tipo definido

interface ZaikoDB extends DBSchema {
  products: {
    key: string;
    value: UIProduct;
    indexes: { 'by-name': string; 'by-code': string };
  };
}

const DB_NAME = 'zaiko-pos-db';
const DB_VERSION = 1;

export const initProductDB = async () => {
  return openDB<ZaikoDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('products')) {
        const store = db.createObjectStore('products', { keyPath: 'id' });
        store.createIndex('by-name', 'name', { unique: false });
        store.createIndex('by-code', 'code', { unique: false });
      }
    },
  });
};

export const cacheProducts = async (products: UIProduct[]) => {
  const db = await initProductDB();
  const tx = db.transaction('products', 'readwrite');
  await Promise.all(products.map((p) => tx.store.put(p)));
  await tx.done;
};

export const searchProductsOffline = async (query: string): Promise<UIProduct[]> => {
  const db = await initProductDB();
  const all = await db.getAll('products');
  
  if (!query) return all;

  const lowerQ = query.toLowerCase();
  return all.filter(p => 
    p.name.toLowerCase().includes(lowerQ) || 
    p.code?.toLowerCase().includes(lowerQ)
  );
};