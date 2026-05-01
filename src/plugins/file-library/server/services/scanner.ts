import { readdirSync, statSync, createReadStream } from 'fs';
import { join, relative, basename } from 'path';
import crypto from 'crypto';
import type { FileEntry } from '../../shared/types/entities';

type ScanEntry = Omit<FileEntry, 'id' | 'downloadOnce' | 'build'>;

interface WalkEntry {
  fullPath: string;
  relativePath: string;
  isDir: boolean;
}

const computeFileSha256 = (filePath: string): Promise<string> =>
  new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = createReadStream(filePath);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });

const walkDir = (dirPath: string, baseDir: string): WalkEntry[] => {
  const results: WalkEntry[] = [];
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
};

const scanDirectory = async (filesPath: string): Promise<ScanEntry[]> => {
  const entries = walkDir(filesPath, filesPath);
  const result: ScanEntry[] = [];

  for (const entry of entries) {
    const name = basename(entry.relativePath);
    const parts = entry.relativePath.split('/');
    const category = parts.length > 1 ? parts[0] : 'root';

    let size = 0;
    let sha256: string | undefined;
    let fileModifiedAt: string | undefined;

    if (!entry.isDir) {
      const stat = statSync(entry.fullPath);
      size = stat.size;
      sha256 = await computeFileSha256(entry.fullPath);
      fileModifiedAt = (stat.mtime || stat.birthtime)?.toISOString();
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
};

export { scanDirectory, computeFileSha256 };
