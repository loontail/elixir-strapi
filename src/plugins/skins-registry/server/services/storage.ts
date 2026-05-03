import { existsSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'fs';
import { join, resolve } from 'path';

const BASE_RELATIVE = join('public', 'skins-registry');

const getBasePath = (): string => resolve(process.cwd(), BASE_RELATIVE);
const getSkinsPath = (): string => join(getBasePath(), 'skins');
const getCapesPath = (): string => join(getBasePath(), 'capes');

const getSkinFilePath = (userId: number): string => join(getSkinsPath(), `${userId}.png`);
const getCapeFilePath = (userId: number): string => join(getCapesPath(), `${userId}.png`);

const getSkinFileUrl = (userId: number): string => `/skins-registry/skins/${userId}.png`;
const getCapeFileUrl = (userId: number): string => `/skins-registry/capes/${userId}.png`;

const ensureDirs = (): void => {
  mkdirSync(getSkinsPath(), { recursive: true });
  mkdirSync(getCapesPath(), { recursive: true });
};

const deleteFileIfExists = (filePath: string): void => {
  if (existsSync(filePath)) rmSync(filePath);
};

const readFileOrNull = (filePath: string): Buffer | null =>
  existsSync(filePath) ? readFileSync(filePath) : null;

const writeSkinFile = (userId: number, buffer: Buffer): void => {
  ensureDirs();
  writeFileSync(getSkinFilePath(userId), buffer);
};

const writeCapeFile = (userId: number, buffer: Buffer): void => {
  ensureDirs();
  writeFileSync(getCapeFilePath(userId), buffer);
};

const deleteSkinFile = (userId: number): void => deleteFileIfExists(getSkinFilePath(userId));
const deleteCapeFile = (userId: number): void => deleteFileIfExists(getCapeFilePath(userId));

const readSkinFile = (userId: number): Buffer | null => readFileOrNull(getSkinFilePath(userId));
const readCapeFile = (userId: number): Buffer | null => readFileOrNull(getCapeFilePath(userId));

export {
  getBasePath,
  getSkinsPath,
  getCapesPath,
  getSkinFilePath,
  getCapeFilePath,
  getSkinFileUrl,
  getCapeFileUrl,
  ensureDirs,
  writeSkinFile,
  writeCapeFile,
  deleteSkinFile,
  deleteCapeFile,
  readSkinFile,
  readCapeFile,
  deleteFileIfExists,
  readFileOrNull,
};
