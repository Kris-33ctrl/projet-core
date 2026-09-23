// Local-first : le service Core tourne dans le navigateur. Si IndexedDB est indisponible
// (navigation privée, stockage bloqué), on bascule en mémoire et on prévient la personne.

import { createCoreService, memoryStore } from '@core/engine';
import { openIdbStore } from './idb.js';

let persistent = true;

// Exporté pour les outils de développement (scénarios de démo), qui écrivent dans le même stockage.
export const storeReady = openIdbStore().catch(() => {
  persistent = false;
  return memoryStore();
});

const ready = storeReady.then((store) => createCoreService(store));

export const isPersistent = async () => (await ready, persistent);

// Mêmes appels qu'avant (api.today(), api.complete()…), désormais servis localement.
export const api = new Proxy(
  {},
  { get: (_, name) => async (...args) => (await ready)[name](...args) },
);
