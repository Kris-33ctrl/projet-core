// Local-first : le service Core tourne dans le navigateur. Si IndexedDB est indisponible
// (navigation privée, stockage bloqué), on bascule en mémoire et on prévient la personne.

import { createCoreService, memoryStore } from '@core/engine';
import { openIdbStore } from './idb.js';

let persistent = true;

const ready = openIdbStore()
  .catch(() => {
    persistent = false;
    return memoryStore();
  })
  .then((store) => createCoreService(store));

export const isPersistent = async () => (await ready, persistent);

// Mêmes appels qu'avant (api.today(), api.complete()…), désormais servis localement.
export const api = new Proxy(
  {},
  { get: (_, name) => async (...args) => (await ready)[name](...args) },
);
