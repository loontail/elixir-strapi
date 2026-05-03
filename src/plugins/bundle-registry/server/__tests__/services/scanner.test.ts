import os from 'os';
import path from 'path';
import fsSync from 'fs';
import crypto from 'crypto';
import { computeFileSha256, scanDirectory } from '../../services/scanner';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fsSync.mkdtempSync(path.join(os.tmpdir(), 'scanner-test-'));
});

afterEach(() => {
  fsSync.rmSync(tmpDir, { recursive: true, force: true });
});

describe('computeFileSha256', () => {
  test('returns correct hex digest for file content', async () => {
    const content = 'hello world';
    const file = path.join(tmpDir, 'test.txt');
    fsSync.writeFileSync(file, content);

    const hash = await computeFileSha256(file);
    const expected = crypto.createHash('sha256').update(content).digest('hex');

    expect(hash).toBe(expected);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  test('produces different hashes for different content', async () => {
    const fileA = path.join(tmpDir, 'a.txt');
    const fileB = path.join(tmpDir, 'b.txt');
    fsSync.writeFileSync(fileA, 'content A');
    fsSync.writeFileSync(fileB, 'content B');

    const [hashA, hashB] = await Promise.all([
      computeFileSha256(fileA),
      computeFileSha256(fileB),
    ]);

    expect(hashA).not.toBe(hashB);
  });

  test('rejects on non-existent file', async () => {
    await expect(computeFileSha256(path.join(tmpDir, 'nonexistent.bin'))).rejects.toThrow();
  });
});

describe('scanDirectory', () => {
  test('returns empty array for empty directory', async () => {
    const results = await scanDirectory(tmpDir);
    expect(results).toEqual([]);
  });

  test('returns empty array for non-existent directory (no throw)', async () => {
    const results = await scanDirectory(path.join(tmpDir, 'does-not-exist'));
    expect(results).toEqual([]);
  });

  test('scans a top-level file with category root', async () => {
    fsSync.writeFileSync(path.join(tmpDir, 'readme.txt'), 'content');

    const results = await scanDirectory(tmpDir);

    expect(results).toHaveLength(1);
    const entry = results[0];
    expect(entry.name).toBe('readme.txt');
    expect(entry.relativePath).toBe('readme.txt');
    expect(entry.category).toBe('root');
    expect(entry.isDir).toBe(false);
    expect(entry.size).toBeGreaterThan(0);
    expect(entry.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(entry.fileModifiedAt).toBeDefined();
  });

  test('assigns category from first path segment for nested file', async () => {
    fsSync.mkdirSync(path.join(tmpDir, 'mods'));
    fsSync.writeFileSync(path.join(tmpDir, 'mods', 'mymod.jar'), 'jar-data');

    const results = await scanDirectory(tmpDir);
    const file = results.find((r) => r.name === 'mymod.jar');

    expect(file).toBeDefined();
    expect(file!.category).toBe('mods');
    expect(file!.relativePath).toBe('mods/mymod.jar');
  });

  test('includes directory entries without sha256', async () => {
    fsSync.mkdirSync(path.join(tmpDir, 'configs'));

    const results = await scanDirectory(tmpDir);
    const dir = results.find((r) => r.isDir);

    expect(dir).toBeDefined();
    expect(dir!.name).toBe('configs');
    expect(dir!.isDir).toBe(true);
    expect(dir!.sha256).toBeUndefined();
    expect(dir!.size).toBe(0);
  });

  test('handles nested directory structure', async () => {
    fsSync.mkdirSync(path.join(tmpDir, 'mods', 'sub'), { recursive: true });
    fsSync.writeFileSync(path.join(tmpDir, 'mods', 'sub', 'deep.jar'), 'data');

    const results = await scanDirectory(tmpDir);
    const file = results.find((r) => r.name === 'deep.jar');

    expect(file).toBeDefined();
    expect(file!.relativePath).toBe('mods/sub/deep.jar');
    expect(file!.category).toBe('mods');
  });

  test('computes correct sha256 matching computeFileSha256', async () => {
    const content = 'test-content-123';
    fsSync.writeFileSync(path.join(tmpDir, 'file.txt'), content);

    const [scanResults, directHash] = await Promise.all([
      scanDirectory(tmpDir),
      computeFileSha256(path.join(tmpDir, 'file.txt')),
    ]);

    expect(scanResults[0].sha256).toBe(directHash);
  });

  test('falls back to birthtime when mtime is null', async () => {
    fsSync.writeFileSync(path.join(tmpDir, 'file.txt'), 'content');
    const birthtime = new Date('2020-01-01T00:00:00.000Z');
    const statSpy = jest.spyOn(fsSync, 'statSync').mockReturnValue({
      size: 7,
      mtime: null as unknown as Date,
      birthtime,
    } as fsSync.Stats);

    try {
      const results = await scanDirectory(tmpDir);
      expect(results[0].fileModifiedAt).toBe(birthtime.toISOString());
    } finally {
      statSpy.mockRestore();
    }
  });
});
