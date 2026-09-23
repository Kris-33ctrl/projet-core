import express from 'express';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDatabase } from './db.js';
import { createApp } from './app.js';

const PORT = Number(process.env.PORT ?? 3001);
const app = createApp(openDatabase());

// En production, le serveur sert aussi le front compilé (npm run build).
const dist = resolve(dirname(fileURLToPath(import.meta.url)), '../../client/dist');
if (existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(resolve(dist, 'index.html')));
}

app.listen(PORT, () => console.log(`Core API → http://localhost:${PORT}`));
