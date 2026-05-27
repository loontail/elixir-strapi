import { join, resolve, normalize, sep } from 'path';
import { mkdirSync, writeFileSync, renameSync, existsSync, rmSync } from 'fs';

const BASE_RELATIVE = join('public', 'bundle-registry', 'builds');

const getBasePath = (): string => resolve(process.cwd(), BASE_RELATIVE);

const getBuildPath = (slug: string): string => join(getBasePath(), slug);

const getFilesPath = (slug: string): string => join(getBuildPath(slug), 'files');

const getManifestPath = (slug: string): string => join(getBuildPath(slug), 'artifacts.json');

const getPublicUrl = (slug: string, relativePath: string, strapi: StrapiLike): string => {
  // Either the plugin's own `publicUrl` override (used when a CDN fronts the
  // files separately from Strapi) or `server.url` from `config/server.js`,
  // which the host project sets from the `URL` env. Both are guaranteed
  // non-empty by config — no hard-coded host literal needed here.
  const baseUrl: string =
    strapi.plugin('bundle-registry').config('publicUrl') ||
    strapi.config.get('server.url');
  const normalizedPath = relativePath.replace(/\\/g, '/');
  return `${baseUrl}/bundle-registry/builds/${slug}/files/${normalizedPath}`;
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
  isPathSafe,
};
