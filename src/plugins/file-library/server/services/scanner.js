'use strict';

const { readdirSync, statSync, createReadStream } = require('fs');
const { join, relative, basename } = require('path');
const crypto = require('crypto');

function computeSha256(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = createReadStream(filePath);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

function walkDir(dirPath, baseDir) {
  const results = [];
  let entries;

  try {
    entries = readdirSync(dirPath, { withFileTypes: true });
  } catch {
    return results;
  }

  for (const entry of entries) {
    const fullPath = join(dirPath, entry.name);
    const relPath = relative(baseDir, fullPath).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      results.push({ fullPath, relativePath: relPath, isDir: true });
      results.push(...walkDir(fullPath, baseDir));
    } else if (entry.isFile()) {
      results.push({ fullPath, relativePath: relPath, isDir: false });
    }
  }

  return results;
}

async function scanDirectory(filesPath) {
  const entries = walkDir(filesPath, filesPath);
  const result = [];

  for (const entry of entries) {
    const name = basename(entry.relativePath);
    // Category = first path segment (top-level directory name, or 'root' for files at top)
    const parts = entry.relativePath.split('/');
    const category = parts.length > 1 ? parts[0] : 'root';

    let size = 0;
    let sha256 = null;
    let fileModifiedAt = null;

    if (!entry.isDir) {
      const stat = statSync(entry.fullPath);
      size = stat.size;
      sha256 = await computeSha256(entry.fullPath);
      fileModifiedAt = stat.mtime || stat.birthtime || null;
    }

    result.push({
      relativePath: entry.relativePath,
      name,
      category,
      size,
      sha256,
      isDir: entry.isDir,
      fileModifiedAt,
    });
  }

  return result;
}

module.exports = { scanDirectory, computeFileSha256: computeSha256 };
