'use strict';

const { join, resolve, normalize, sep } = require('path');
const { mkdirSync, writeFileSync, renameSync, existsSync, rmSync } = require('fs');

const BASE_RELATIVE = join('public', 'file-library', 'builds');

function getBasePath() {
  return resolve(process.cwd(), BASE_RELATIVE);
}

function getBuildPath(slug) {
  return join(getBasePath(), slug);
}

function getFilesPath(slug) {
  return join(getBuildPath(slug), 'files');
}

function getManifestPath(slug) {
  return join(getBuildPath(slug), 'artifacts.json');
}

function getPublicUrl(slug, relativePath, strapi) {
  const baseUrl =
    strapi.plugin('file-library').config('publicUrl') ||
    strapi.config.get('server.url', 'http://localhost:1337');
  const normalizedPath = relativePath.replace(/\\/g, '/');
  return `${baseUrl}/file-library/builds/${slug}/files/${normalizedPath}`;
}

function ensureBuildDir(slug) {
  mkdirSync(getFilesPath(slug), { recursive: true });
}

function writeManifestAtomic(slug, content) {
  const manifestPath = getManifestPath(slug);
  const tmpPath = `${manifestPath}.tmp`;
  mkdirSync(getBuildPath(slug), { recursive: true });
  writeFileSync(tmpPath, JSON.stringify(content, null, 2), 'utf8');
  renameSync(tmpPath, manifestPath);
}

function deleteBuildFiles(slug) {
  const buildPath = getBuildPath(slug);
  if (existsSync(buildPath)) {
    rmSync(buildPath, { recursive: true, force: true });
  }
}

function deleteFilesDir(slug) {
  const filesPath = getFilesPath(slug);
  if (existsSync(filesPath)) {
    rmSync(filesPath, { recursive: true, force: true });
  }
}

// Validate that a resolved path stays within the expected base directory (zip-slip guard)
function isPathSafe(resolvedPath, baseDir) {
  const normalizedBase = normalize(baseDir) + sep;
  const normalizedResolved = normalize(resolvedPath);
  return normalizedResolved.startsWith(normalizedBase) || normalizedResolved === normalize(baseDir);
}

module.exports = {
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
