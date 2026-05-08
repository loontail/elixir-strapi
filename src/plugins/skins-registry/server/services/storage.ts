import { existsSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'fs';
import { join, resolve } from 'path';
import { randomBytes } from 'crypto';

const BASE_RELATIVE = join('public', 'skins-registry');

const getBasePath = (): string => resolve(process.cwd(), BASE_RELATIVE);
const getSkinsPath = (): string => join(getBasePath(), 'skins');
const getCapesPath = (): string => join(getBasePath(), 'capes');

// Each upload gets its own filename so the public URL changes too. That's
// the whole point of this layout: HTTP caches (Chromium in the launcher,
// any reverse proxy in front of Strapi) see a brand-new resource and never
// serve stale bytes for a freshly-uploaded skin. The previous file lives
// at the path stored on the prior DB row and is cleaned up by the
// controller after the new row is committed.
const REVISION_BYTES = 6;
const generateRevision = (): string => randomBytes(REVISION_BYTES).toString('hex');

const buildSkinFilename = (userId: number): string => `${userId}-${generateRevision()}.png`;
const buildCapeFilename = (userId: number): string => `${userId}-${generateRevision()}.png`;

const getSkinFilePath = (filename: string): string => join(getSkinsPath(), filename);
const getCapeFilePath = (filename: string): string => join(getCapesPath(), filename);

const getSkinFileUrl = (filename: string): string => `/skins-registry/skins/${filename}`;
const getCapeFileUrl = (filename: string): string => `/skins-registry/capes/${filename}`;

const ensureDirs = (): void => {
  mkdirSync(getSkinsPath(), { recursive: true });
  mkdirSync(getCapesPath(), { recursive: true });
};

const deleteFileIfExists = (filePath: string): void => {
  if (existsSync(filePath)) rmSync(filePath);
};

const readFileOrNull = (filePath: string): Buffer | null =>
  existsSync(filePath) ? readFileSync(filePath) : null;

const writeSkinFile = (filename: string, buffer: Buffer): void => {
  ensureDirs();
  writeFileSync(getSkinFilePath(filename), buffer);
};

const writeCapeFile = (filename: string, buffer: Buffer): void => {
  ensureDirs();
  writeFileSync(getCapeFilePath(filename), buffer);
};

export {
  getBasePath,
  getSkinsPath,
  getCapesPath,
  buildSkinFilename,
  buildCapeFilename,
  getSkinFilePath,
  getCapeFilePath,
  getSkinFileUrl,
  getCapeFileUrl,
  ensureDirs,
  writeSkinFile,
  writeCapeFile,
  deleteFileIfExists,
  readFileOrNull,
};
