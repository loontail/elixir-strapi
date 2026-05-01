import AdmZip from 'adm-zip';
import { join } from 'path';
import { mkdirSync, writeFileSync } from 'fs';
import { isPathSafe } from './storage';

interface ExtractOptions {
  maxSize?: number;
  maxEntries?: number;
}

const extractZip = (zipFilePath: string, destPath: string, options: ExtractOptions = {}): void => {
  const { maxSize = 10 * 1024 * 1024 * 1024, maxEntries = 100_000 } = options;

  const zip = new AdmZip(zipFilePath);
  const entries = zip.getEntries();

  if (entries.length > maxEntries) {
    throw new Error(`ZIP contains too many entries (${entries.length}). Limit is ${maxEntries}.`);
  }

  let totalUncompressedSize = 0;

  for (const entry of entries) {
    const rawName = entry.entryName;

    // Skip macOS metadata directories
    if (rawName.startsWith('__MACOSX/') || rawName === '__MACOSX') continue;

    // Strip leading slashes and normalize separators
    const safeName = rawName.replace(/^\/+/, '').replace(/\\/g, '/');
    if (!safeName) continue;

    // Zip-slip protection: resolve final path and verify it stays inside destPath
    const destEntryPath = join(destPath, safeName);
    if (!isPathSafe(destEntryPath, destPath)) {
      throw new Error(`Zip-slip detected for entry: ${rawName}`);
    }

    totalUncompressedSize += entry.header.size || 0;
    if (totalUncompressedSize > maxSize) {
      throw new Error(`ZIP total uncompressed size exceeds limit of ${maxSize} bytes.`);
    }

    if (entry.isDirectory) {
      mkdirSync(destEntryPath, { recursive: true });
    } else {
      mkdirSync(join(destEntryPath, '..'), { recursive: true });
      writeFileSync(destEntryPath, entry.getData());
    }
  }
};

export { extractZip };
