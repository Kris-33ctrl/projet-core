// Stockage local-first : IndexedDB, sur l'appareil de la personne. Rien n'est envoyé à un serveur.

const DB_NAME = 'core';
const VERSION = 1;
const COLLECTIONS = ['users', 'assessments', 'screenings', 'checkins', 'practices'];

function request(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function openIdbStore() {
  const open = indexedDB.open(DB_NAME, VERSION);
  open.onupgradeneeded = () => {
    const db = open.result;
    for (const name of COLLECTIONS) {
      if (db.objectStoreNames.contains(name)) continue;
      const store = db.createObjectStore(name, { keyPath: 'id' });
      if (name !== 'users') store.createIndex('userId', 'userId');
    }
  };
  const db = await request(open);

  const run = (name, mode, action) =>
    new Promise((resolve, reject) => {
      const tx = db.transaction(name, mode);
      const req = action(tx.objectStore(name));
      tx.oncomplete = () => resolve(req?.result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });

  return {
    get: async (name, id) => (await run(name, 'readonly', (s) => s.get(id))) ?? null,
    put: async (name, record) => {
      await run(name, 'readwrite', (s) => s.put(record));
      return record;
    },
    list: (name, userId) => run(name, 'readonly', (s) => s.index('userId').getAll(userId)),
    clear: () =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(COLLECTIONS, 'readwrite');
        COLLECTIONS.forEach((name) => tx.objectStore(name).clear());
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      }),
  };
}
