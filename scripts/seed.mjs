// Seeds the local Strapi instance with test data for everything except
// bundle-registry (which already manages its own builds via the admin UI).
// Run with `node scripts/seed.mjs` after `npm run dev` is up.
//
// Reads API_URL + API_TOKEN from elixir-app/.env (the launcher's token has
// full read+write — same surface seeding needs).

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Buffer } from 'node:buffer';

const here = dirname(fileURLToPath(import.meta.url));
const launcherEnvPath = join(here, '..', '..', 'elixir-app', '.env');
const env = Object.fromEntries(
  readFileSync(launcherEnvPath, 'utf-8')
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .map((line) => {
      const idx = line.indexOf('=');
      return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()];
    }),
);

// Force IPv4 — Node 24 prefers IPv6 for `localhost`, but Strapi binds to
// `0.0.0.0` (IPv4) per the .env, which produces ECONNREFUSED on the v6
// attempt before fetch falls back. Pinning the URL avoids the dance.
const API_URL = (env.API_URL || 'http://localhost:1337').replace('localhost', '127.0.0.1');
const API_TOKEN = env.API_TOKEN;
if (!API_TOKEN) throw new Error('API_TOKEN missing in elixir-app/.env');

const auth = { Authorization: `Bearer ${API_TOKEN}` };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const api = async (path, init = {}, attempt = 0) => {
  const url = `${API_URL}/api${path}`;
  const headers = { ...auth, ...(init.headers ?? {}) };
  if (!(init.body instanceof FormData) && init.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  let res;
  try {
    res = await fetch(url, { ...init, headers });
  } catch (err) {
    if (attempt < 3) {
      await sleep(500 * (attempt + 1));
      return api(path, init, attempt + 1);
    }
    throw new Error(`${init.method ?? 'GET'} ${path} network error: ${err.message}`);
  }
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`${init.method ?? 'GET'} ${path} → ${res.status}: ${text.slice(0, 500)}`);
  }
  return text ? JSON.parse(text) : null;
};

// --- placeholder images via placehold.co (returns PNG with text overlay) ---
const fetchImage = async (width, height, color, label) => {
  const url = `https://placehold.co/${width}x${height}/${color}/ffffff/png?text=${encodeURIComponent(label)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`placehold ${url} → ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
};

const upload = async (filename, buffer, mime = 'image/png', attempt = 0) => {
  const form = new FormData();
  form.append('files', new Blob([buffer], { type: mime }), filename);
  let res;
  try {
    res = await fetch(`${API_URL}/api/upload`, { method: 'POST', headers: auth, body: form });
  } catch (err) {
    if (attempt < 3) {
      await sleep(500 * (attempt + 1));
      return upload(filename, buffer, mime, attempt + 1);
    }
    throw new Error(`upload ${filename} network error: ${err.message}`);
  }
  if (!res.ok) throw new Error(`upload ${filename} → ${res.status}: ${await res.text()}`);
  const arr = await res.json();
  return arr[0]; // { id, url, name, ... }
};

const log = (...parts) => console.log('[seed]', ...parts);

// ---------------------------------------------------------------------------

const KEYWORDS = ['Survival', 'PvP', 'Modded', 'Vanilla', 'Adventure'];

const SERVERS = [
  { name: 'Main', address: 'play.example.com' },
  { name: 'Creative', address: 'creative.example.com:25566' },
  { name: 'Hardcore', address: 'hc.example.com' },
];

const CLIENTS = [
  {
    title: 'Vanilla 1.20.4',
    shortDescription: 'Stock Minecraft — official Mojang flow, no mods.',
    description:
      'Plain vanilla Minecraft 1.20.4. The launcher fetches every file from the official Mojang servers; no bundle overlay is applied. Use this client to verify the runtime + minecraft phases of the install pipeline.',
    available: true,
    minecraftVersion: '1.20.4',
    forgeVersion: null,
    fabricVersion: null,
    runtimeVersion: 'java-runtime-gamma',
    bundleSlug: null,
    keywordTitles: ['Vanilla', 'Survival'],
    serverNames: ['Main'],
    poster: { color: '1d4ed8', label: 'Vanilla' },
    background: { color: '0f172a', label: 'Vanilla\\n1.20.4' },
    title_color: 'eab308',
  },
  {
    title: 'Forge Pack 1.20.4',
    shortDescription: 'Forge 49.0.30 with the official Mojang base game.',
    description:
      'Minecraft 1.20.4 + Forge 49.0.30. Loader files are installed via the new Forge processor flow (own implementation, no @xmcl deps). Optionally layer a mods bundle via bundle-registry — left empty here.',
    available: true,
    minecraftVersion: '1.20.4',
    forgeVersion: '49.0.30',
    fabricVersion: null,
    runtimeVersion: 'java-runtime-gamma',
    bundleSlug: null,
    keywordTitles: ['Modded', 'Survival'],
    serverNames: ['Main', 'Hardcore'],
    poster: { color: '7f1d1d', label: 'Forge' },
    background: { color: '450a0a', label: 'Forge\\n49.0.30' },
  },
  {
    title: 'Fabric Pack 1.20.4',
    shortDescription: 'Fabric loader 0.15.7 on top of vanilla 1.20.4.',
    description:
      'Minecraft 1.20.4 with Fabric loader 0.15.7. Fabric installation merges the upstream profile JSON with the vanilla manifest at launch time. Lightweight loader compared to Forge.',
    available: true,
    minecraftVersion: '1.20.4',
    forgeVersion: null,
    fabricVersion: '0.15.7',
    runtimeVersion: 'java-runtime-gamma',
    bundleSlug: null,
    keywordTitles: ['Modded', 'PvP'],
    serverNames: ['Creative'],
    poster: { color: '047857', label: 'Fabric' },
    background: { color: '022c22', label: 'Fabric\\n0.15.7' },
  },
  {
    title: 'Dual-loader 1.20.4',
    shortDescription: 'Both Forge and Fabric — exercises the loader-choice modal.',
    description:
      'A demo client that declares both Forge and Fabric. The first time you press Play the launcher opens the LoaderChoice modal; check "Remember my choice" to persist `clients[slug].preferredLoader`, or switch the loader from the Client Settings dropdown.',
    available: true,
    minecraftVersion: '1.20.4',
    forgeVersion: '49.0.30',
    fabricVersion: '0.15.7',
    runtimeVersion: 'java-runtime-gamma',
    bundleSlug: null,
    keywordTitles: ['Modded', 'Adventure'],
    serverNames: ['Main', 'Creative', 'Hardcore'],
    poster: { color: '581c87', label: 'Dual' },
    background: { color: '2e1065', label: 'Dual-loader\\n1.20.4' },
  },
];

// ---------------------------------------------------------------------------

const main = async () => {
  log(`API = ${API_URL}`);

  // 1. Wipe any existing seeded entries so the script is idempotent. We
  //    only delete entities we know we own (clients/keywords/servers).
  log('cleaning existing clients / keywords / servers');
  for (const path of ['/clients', '/keywords', '/servers']) {
    // Drain pages until empty — DELETE removes from the same locale only,
    // so a single sweep with pageSize=100 may miss other-locale entries.
    let removed = 0;
    for (let page = 0; page < 10; page += 1) {
      const list = await api(`${path}?pagination%5BpageSize%5D=100`);
      const items = list?.data ?? [];
      if (items.length === 0) break;
      for (const item of items) {
        const docId = item.documentId ?? item.id;
        if (!docId) continue;
        try {
          await api(`${path}/${docId}`, { method: 'DELETE' });
          removed += 1;
        } catch (err) {
          log(`  delete ${path}/${docId} skipped: ${err.message.slice(0, 120)}`);
        }
      }
    }
    log(`  removed ${removed} from ${path}`);
  }

  // 2. Keywords (default locale = en)
  log('creating keywords');
  const keywordIds = {};
  for (const title of KEYWORDS) {
    const created = await api('/keywords', {
      method: 'POST',
      body: JSON.stringify({ data: { title } }),
    });
    keywordIds[title] = created.data.documentId ?? created.data.id;
    log(`  + keyword ${title} → ${keywordIds[title]}`);
  }

  // 3. Servers
  log('creating servers');
  const serverIds = {};
  for (const server of SERVERS) {
    const created = await api('/servers', {
      method: 'POST',
      body: JSON.stringify({ data: server }),
    });
    serverIds[server.name] = created.data.documentId ?? created.data.id;
    log(`  + server ${server.name} → ${serverIds[server.name]}`);
  }

  // 4. Clients (with uploaded media + relations)
  log('creating clients');
  for (const c of CLIENTS) {
    log(`  client: ${c.title}`);

    log('    uploading background…');
    const bgImg = await fetchImage(1920, 1080, c.background.color, c.background.label);
    const bg = await upload(`${slugify(c.title)}-background.png`, bgImg);

    log('    uploading poster…');
    const posterImg = await fetchImage(512, 512, c.poster.color, c.poster.label);
    const poster = await upload(`${slugify(c.title)}-poster.png`, posterImg);

    log('    uploading screenshots…');
    const ss = [];
    for (let i = 1; i <= 3; i += 1) {
      const buf = await fetchImage(1280, 720, c.poster.color, `${c.title} #${i}`);
      const file = await upload(`${slugify(c.title)}-screenshot-${i}.png`, buf);
      ss.push(file.id);
    }

    const data = {
      title: c.title,
      shortDescription: c.shortDescription,
      description: c.description,
      available: c.available,
      minecraftVersion: c.minecraftVersion,
      forgeVersion: c.forgeVersion,
      fabricVersion: c.fabricVersion,
      runtimeVersion: c.runtimeVersion,
      bundleSlug: c.bundleSlug,
      background: bg.id,
      poster: poster.id,
      screenshots: ss,
      keywords: c.keywordTitles.map((title) => keywordIds[title]),
      servers: c.serverNames.map((name) => serverIds[name]),
    };

    const created = await api('/clients?status=published', {
      method: 'POST',
      body: JSON.stringify({ data }),
    });
    log(`    + ${c.title} → ${created.data.documentId ?? created.data.id}`);
  }

  log('seed complete');
};

const slugify = (input) =>
  input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

main().catch((err) => {
  console.error('[seed] FAILED:', err);
  process.exitCode = 1;
});
