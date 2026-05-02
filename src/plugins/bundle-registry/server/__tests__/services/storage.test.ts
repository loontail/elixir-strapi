import path from 'path';
import { mkdirSync, writeFileSync, renameSync, existsSync, rmSync } from 'fs';
import {
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
} from '../../services/storage';

jest.mock('fs', () => ({
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
  renameSync: jest.fn(),
  existsSync: jest.fn(),
  rmSync: jest.fn(),
}));

const makeStrapi = (publicUrl: string | null, serverUrl = 'http://localhost:1337') => ({
  plugin: (_name: string) => ({ config: (_key: string) => publicUrl }),
  config: { get: (_key: string, fallback?: string) => serverUrl ?? fallback ?? 'http://localhost:1337' },
});

beforeEach(() => jest.clearAllMocks());

describe('path helpers', () => {
  test('getBasePath ends with public/bundle-registry/builds', () => {
    const base = getBasePath();
    expect(base).toBe(path.resolve(process.cwd(), 'public', 'bundle-registry', 'builds'));
  });

  test('getBuildPath appends slug', () => {
    expect(getBuildPath('my-build')).toBe(path.join(getBasePath(), 'my-build'));
  });

  test('getFilesPath appends files subdir', () => {
    expect(getFilesPath('my-build')).toBe(path.join(getBuildPath('my-build'), 'files'));
  });

  test('getManifestPath returns artifacts.json', () => {
    expect(getManifestPath('my-build')).toBe(
      path.join(getBuildPath('my-build'), 'artifacts.json'),
    );
  });
});

describe('getPublicUrl', () => {
  test('uses publicUrl from plugin config when set', () => {
    const strapi = makeStrapi('https://cdn.example.com');
    expect(getPublicUrl('build1', 'mods/file.jar', strapi as never)).toBe(
      'https://cdn.example.com/bundle-registry/builds/build1/files/mods/file.jar',
    );
  });

  test('falls back to server.url when publicUrl is empty', () => {
    const strapi = makeStrapi('', 'http://localhost:1337');
    expect(getPublicUrl('build1', 'file.jar', strapi as never)).toBe(
      'http://localhost:1337/bundle-registry/builds/build1/files/file.jar',
    );
  });

  test('normalizes backslashes in relativePath', () => {
    const strapi = makeStrapi('https://cdn.example.com');
    expect(getPublicUrl('build1', 'mods\\subdir\\file.jar', strapi as never)).toBe(
      'https://cdn.example.com/bundle-registry/builds/build1/files/mods/subdir/file.jar',
    );
  });
});

describe('isPathSafe', () => {
  const base = path.resolve('/safe/base');

  test('returns true for path inside base', () => {
    expect(isPathSafe(path.join(base, 'subdir', 'file.txt'), base)).toBe(true);
  });

  test('returns true for the base dir itself', () => {
    expect(isPathSafe(base, base)).toBe(true);
  });

  test('returns false for path outside base', () => {
    const sibling = path.resolve('/safe/other', 'file.txt');
    expect(isPathSafe(sibling, base)).toBe(false);
  });

  test('returns false for zip-slip traversal', () => {
    const escaped = path.resolve(base, '..', '..', 'etc', 'passwd');
    expect(isPathSafe(escaped, base)).toBe(false);
  });
});

describe('ensureBuildDir', () => {
  test('calls mkdirSync on files path with recursive: true', () => {
    ensureBuildDir('test-slug');
    expect(mkdirSync).toHaveBeenCalledWith(getFilesPath('test-slug'), {
      recursive: true,
    });
  });
});

describe('writeManifestAtomic', () => {
  test('writes JSON to .tmp then renames to final path', () => {
    const content = { mods: [] };
    writeManifestAtomic('test-slug', content);
    const manifestPath = getManifestPath('test-slug');
    expect(writeFileSync).toHaveBeenCalledWith(
      `${manifestPath}.tmp`,
      JSON.stringify(content, null, 2),
      'utf8',
    );
    expect(renameSync).toHaveBeenCalledWith(`${manifestPath}.tmp`, manifestPath);
  });

  test('creates build directory before writing', () => {
    writeManifestAtomic('test-slug', {});
    expect(mkdirSync).toHaveBeenCalledWith(getBuildPath('test-slug'), {
      recursive: true,
    });
  });
});

describe('deleteBuildFiles', () => {
  test('calls rmSync when build path exists', () => {
    (existsSync as jest.Mock).mockReturnValue(true);
    deleteBuildFiles('test-slug');
    expect(rmSync).toHaveBeenCalledWith(getBuildPath('test-slug'), {
      recursive: true,
      force: true,
    });
  });

  test('does nothing when build path does not exist', () => {
    (existsSync as jest.Mock).mockReturnValue(false);
    deleteBuildFiles('missing');
    expect(rmSync).not.toHaveBeenCalled();
  });
});

describe('deleteFilesDir', () => {
  test('calls rmSync when files dir exists', () => {
    (existsSync as jest.Mock).mockReturnValue(true);
    deleteFilesDir('test-slug');
    expect(rmSync).toHaveBeenCalledWith(getFilesPath('test-slug'), {
      recursive: true,
      force: true,
    });
  });

  test('does nothing when files dir does not exist', () => {
    (existsSync as jest.Mock).mockReturnValue(false);
    deleteFilesDir('missing');
    expect(rmSync).not.toHaveBeenCalled();
  });
});
