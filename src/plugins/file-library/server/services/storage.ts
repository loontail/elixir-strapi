import { join, resolve, normalize, sep } from 'path';
import { mkdirSync, writeFileSync, renameSync, existsSync, rmSync } from 'fs';

const BASE_RELATIVE = join('public', 'file-library', 'builds');

const getBasePath = (): string => resolve(process.cwd(), BASE_RELATIVE);

const getBuildPath = (slug: string): string => join(getBasePath(), slug);

const getFilesPath = (slug: string): string => join(getBuildPath(slug), 'files');

const getManifestPath = (slug: string): string => join(getBuildPath(slug), 'artifacts.json');

const getPublicUrl = (slug: string, relativePath: string, strapi: StrapiLike): string => {
  const baseUrl: string =
    strapi.plugin('file-library').config('publicUrl') ||
    strapi.config.get('server.url', 'http://localhost:1337');
  const normalizedPath = relativePath.replace(/\\/g, '/');
  return `${baseUrl}/file-library/builds/${slug}/files/${normalizedPath}`;
};

const ensureBuildDir = (slug: string): void => {
  mkdirSync(getFilesPath(slug), { recursive: true });
};

const writeManifestAtomic = (slug: string, content: unknown): void => {
  const manifestPath = getManifestPath(slug);
  const tmpPath = `${manifestPath}.tmp`;
  mkdirSync(getBuildPath(slug), { recursive: true });
  writeFileSync(tmpPath, JSON.stringify(content, null, 2), 'utf8');
  renameSync(tmpPath, manifestPath);
};

const deleteBuildFiles = (slug: string): void => {
  const buildPath = getBuildPath(slug);
  if (existsSync(buildPath)) {
    rmSync(buildPath, { recursive: true, force: true });
  }
};

const deleteFilesDir = (slug: string): void => {
  const filesPath = getFilesPath(slug);
  if (existsSync(filesPath)) {
    rmSync(filesPath, { recursive: true, force: true });
  }
};

// Zip-slip guard: verify resolved path stays within the expected base directory
const isPathSafe = (resolvedPath: string, baseDir: string): boolean => {
  const normalizedBase = normalize(baseDir) + sep;
  const normalizedResolved = normalize(resolvedPath);
  return normalizedResolved.startsWith(normalizedBase) || normalizedResolved === normalize(baseDir);
};

// Minimal interface for the strapi object used in this module
interface StrapiLike {
  plugin: (name: string) => { config: (key: string) => string };
  config: { get: (key: string, fallback?: string) => string };
}

export {
  getBasePath,
  getBuildPath,
  getFilesPath,
  getManifestPath,
  getPublicUrl,
  ensureBuildDir,
  writeManifestAtomic,
  deleteBuildFiles,
  deleteFilesDir,
  isPathSafe,
};
