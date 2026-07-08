import { getDB, STORES, getAll, bulkPut, clear } from '../db/database.js';

const BACKUP_VERSION = 1;

export async function exportBackup() {
  const db = await getDB();
  const data = { _meta: { version: BACKUP_VERSION, exportedAt: new Date().toISOString() } };
  for (const name of Object.values(STORES)) {
    if (name === STORES.meta) continue;
    data[name] = await getAll(name);
  }
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `dental-pms-backup-${stamp}.json`;
  a.click();
  URL.revokeObjectURL(url);
  return data;
}

export async function importBackup(file) {
  const text = await file.text();
  const data = JSON.parse(text);
  if (!data || typeof data !== 'object') throw new Error('Invalid backup file');
  const db = await getDB();
  for (const name of Object.values(STORES)) {
    if (name === STORES.meta) continue;
    if (Array.isArray(data[name])) {
      await clear(name);
      if (data[name].length) await bulkPut(name, data[name]);
    }
  }
  return data;
}

export async function wipeAll() {
  for (const name of Object.values(STORES)) {
    if (name === STORES.meta) continue;
    await clear(name);
  }
}
