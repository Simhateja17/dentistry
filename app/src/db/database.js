const DB_NAME = 'dental-pms';
const DB_VERSION = 1;

export const STORES = {
  clinicSettings: 'clinicSettings',
  patients: 'patients',
  appointments: 'appointments',
  visits: 'visits',
  plans: 'plans',
  labCases: 'labCases',
  invoices: 'invoices',
  stock: 'stock',
  stockBatches: 'stockBatches',
  supplierOrders: 'supplierOrders',
  staffTimesheets: 'staffTimesheets',
  chartSnapshots: 'chartSnapshots',
  meta: 'meta',
};

const KEYED = new Set([STORES.clinicSettings, STORES.meta]);

let dbPromise = null;

export function getDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      for (const name of Object.values(STORES)) {
        if (!db.objectStoreNames.contains(name)) {
          if (KEYED.has(name)) db.createObjectStore(name, { keyPath: 'key' });
          else db.createObjectStore(name, { keyPath: 'id' });
        }
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx(db, store, mode = 'readonly') {
  return db.transaction(store, mode).objectStore(store);
}

function promisify(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function get(store, key) {
  const db = await getDB();
  return promisify(tx(db, store).get(key));
}

export async function getAll(store) {
  const db = await getDB();
  return promisify(tx(db, store).getAll());
}

export async function put(store, value) {
  const db = await getDB();
  await promisify(tx(db, store, 'readwrite').put(value));
  return value;
}

export async function bulkPut(store, values) {
  const db = await getDB();
  const t = db.transaction(store, 'readwrite');
  const os = t.objectStore(store);
  for (const v of values) os.put(v);
  return new Promise((resolve, reject) => { t.oncomplete = () => resolve(values); t.onerror = () => reject(t.error); });
}

export async function remove(store, key) {
  const db = await getDB();
  return promisify(tx(db, store, 'readwrite').delete(key));
}

export async function clear(store) {
  const db = await getDB();
  return promisify(tx(db, store, 'readwrite').clear());
}

export async function count(store) {
  const db = await getDB();
  return promisify(tx(db, store).count());
}

export function uid(prefix = '') {
  const s = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  return prefix ? prefix + '-' + s : s;
}
