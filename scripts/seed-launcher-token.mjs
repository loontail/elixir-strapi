// Seeds an api-token row whose `access_key` matches what the custom
// `plugin::skins-registry.api-token-auth` policy expects.
//
// The policy hashes the raw bearer token with SHA-512 and looks the result
// up in `strapi_api_tokens.access_key`. Tokens generated through the Strapi
// admin UI use HMAC instead, so a UI-generated row never satisfies the
// policy. This script inserts a row with the right access_key shape, using
// the token that lives in `minecraft-launcher/.env` (or elixir-app/.env).
//
// Run with: node scripts/seed-launcher-token.mjs

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..');

const readEnv = (path) => {
  try {
    return Object.fromEntries(
      readFileSync(path, 'utf-8')
        .split(/\r?\n/)
        .filter((line) => line && !line.startsWith('#') && line.includes('='))
        .map((line) => {
          const idx = line.indexOf('=');
          return [line.slice(0, idx).trim(), line.slice(idx + 1).trim().replace(/^"|"$/g, '')];
        }),
    );
  } catch {
    return {};
  }
};

const strapiEnv = readEnv(join(here, '..', '.env'));
const launcherEnv =
  readEnv(join(repoRoot, 'minecraft-launcher', '.env')).API_TOKEN
    ? readEnv(join(repoRoot, 'minecraft-launcher', '.env'))
    : readEnv(join(repoRoot, 'elixir-app', '.env'));

const RAW_TOKEN = launcherEnv.API_TOKEN;
if (!RAW_TOKEN) {
  throw new Error('API_TOKEN not found in minecraft-launcher/.env or elixir-app/.env');
}

const accessKey = createHash('sha512').update(RAW_TOKEN).digest('hex');

const client = new pg.Client({
  host: strapiEnv.DATABASE_HOST || 'localhost',
  port: Number(strapiEnv.DATABASE_PORT || 5432),
  database: strapiEnv.DATABASE_NAME || 'elixir_strapi',
  user: strapiEnv.DATABASE_USERNAME || 'postgres',
  password: strapiEnv.DATABASE_PASSWORD || 'root',
});

await client.connect();

const TOKEN_NAME = 'launcher (sha512-policy)';

const existing = await client.query(
  'SELECT id FROM strapi_api_tokens WHERE access_key = $1 LIMIT 1',
  [accessKey],
);

if (existing.rowCount > 0) {
  console.log(`[ok] token row already present (id=${existing.rows[0].id}). nothing to do.`);
} else {
  const byName = await client.query(
    'SELECT id FROM strapi_api_tokens WHERE name = $1 LIMIT 1',
    [TOKEN_NAME],
  );

  if (byName.rowCount > 0) {
    const id = byName.rows[0].id;
    await client.query(
      `UPDATE strapi_api_tokens
         SET access_key = $1,
             updated_at = NOW()
       WHERE id = $2`,
      [accessKey, id],
    );
    console.log(`[ok] updated existing row "${TOKEN_NAME}" (id=${id}) with new access_key.`);
  } else {
    const inserted = await client.query(
      `INSERT INTO strapi_api_tokens
         (name, description, type, access_key, lifespan, expires_at, last_used_at, created_at, updated_at, document_id, locale, published_at)
       VALUES ($1, $2, 'full-access', $3, NULL, NULL, NULL, NOW(), NOW(), $4, NULL, NOW())
       RETURNING id`,
      [
        TOKEN_NAME,
        'Seeded by scripts/seed-launcher-token.mjs — required by plugin::skins-registry.api-token-auth (raw SHA-512 over the bearer token).',
        accessKey,
        `launcher-sha512-${Date.now()}`,
      ],
    );
    console.log(`[ok] inserted "${TOKEN_NAME}" row (id=${inserted.rows[0].id}).`);
  }
}

await client.end();
console.log('[done] launcher token row is in place.');
