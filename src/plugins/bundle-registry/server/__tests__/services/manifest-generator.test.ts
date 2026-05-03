jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
}));

jest.mock('../../services/storage', () => ({
  getPublicUrl: jest.fn(
    (_slug: string, relPath: string) => `http://cdn.example.com/files/${relPath}`,
  ),
  writeManifestAtomic: jest.fn(),
  getFilesPath: jest.fn((slug: string) => `/builds/${slug}/files`),
}));

import { generate } from '../../services/manifest-generator';
import { writeManifestAtomic, getPublicUrl } from '../../services/storage';

const mockWriteManifest = writeManifestAtomic as jest.Mock;
const mockGetPublicUrl = getPublicUrl as jest.Mock;

type Entry = {
  relativePath: string;
  name: string;
  category: string;
  size: number | string | null;
  isDir: boolean;
  sha256?: string;
  downloadOnce: boolean;
  build?: { slug: string };
};

const makeStrapi = (entries: Entry[], buildId = 1) => {
  const entryFindMany = jest.fn().mockResolvedValue(entries);
  const buildFindMany = jest.fn().mockResolvedValue([{ id: buildId }]);
  const buildUpdate = jest.fn().mockResolvedValue({});

  const queryMock = jest.fn().mockImplementation((model: string) => {
    if (model.includes('artifact')) return { findMany: entryFindMany };
    if (model.includes('build'))
      return { findMany: buildFindMany, update: buildUpdate };
    return { findMany: jest.fn().mockResolvedValue([]) };
  });

  return {
    strapi: {
      db: { query: queryMock },
      plugin: () => ({ config: () => null }),
      config: { get: () => 'http://localhost:1337' },
    },
    buildUpdate,
    entryFindMany,
  };
};

beforeEach(() => jest.clearAllMocks());

describe('generate', () => {
  test('returns empty manifest and marks build ready when no entries', async () => {
    const { strapi, buildUpdate } = makeStrapi([]);

    const result = await generate('my-build', strapi as never);

    expect(result).toEqual({});
    expect(mockWriteManifest).toHaveBeenCalledWith('my-build', {});
    expect(buildUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'ready',
          filesCount: 0,
          totalSize: '0',
        }),
      }),
    );
  });

  test('groups entries by category', async () => {
    const { strapi } = makeStrapi([
      {
        relativePath: 'mods/a.jar',
        name: 'a.jar',
        category: 'mods',
        size: 100,
        isDir: false,
        sha256: 'aaa',
        downloadOnce: false,
      },
      {
        relativePath: 'configs/b.cfg',
        name: 'b.cfg',
        category: 'configs',
        size: 50,
        isDir: false,
        sha256: 'bbb',
        downloadOnce: false,
      },
    ]);

    const result = await generate('my-build', strapi as never);

    expect(Object.keys(result)).toEqual(expect.arrayContaining(['mods', 'configs']));
    expect(result['mods']).toHaveLength(1);
    expect(result['configs']).toHaveLength(1);
  });

  test('includes url and sha256 for file entries', async () => {
    const { strapi } = makeStrapi([
      {
        relativePath: 'mods/file.jar',
        name: 'file.jar',
        category: 'mods',
        size: 200,
        isDir: false,
        sha256: 'deadbeef',
        downloadOnce: false,
      },
    ]);

    const result = await generate('my-build', strapi as never);
    const entry = result['mods'][0];

    expect(entry.sha256).toBe('deadbeef');
    expect(entry.url).toContain('file.jar');
    expect(mockGetPublicUrl).toHaveBeenCalledWith('my-build', 'mods/file.jar', strapi);
  });

  test('does not include url/sha256 for directory entries', async () => {
    const { strapi } = makeStrapi([
      {
        relativePath: 'mods',
        name: 'mods',
        category: 'root',
        size: 0,
        isDir: true,
        downloadOnce: false,
      },
    ]);

    const result = await generate('my-build', strapi as never);
    const entry = result['root'][0];

    expect(entry.isDir).toBe(true);
    expect(entry.url).toBeUndefined();
    expect(entry.sha256).toBeUndefined();
  });

  test('sets downloadOnce flag when entry has it', async () => {
    const { strapi } = makeStrapi([
      {
        relativePath: 'mods/once.jar',
        name: 'once.jar',
        category: 'mods',
        size: 100,
        isDir: false,
        sha256: 'ccc',
        downloadOnce: true,
      },
    ]);

    const result = await generate('my-build', strapi as never);
    expect(result['mods'][0].downloadOnce).toBe(true);
  });

  test('omits downloadOnce when false', async () => {
    const { strapi } = makeStrapi([
      {
        relativePath: 'mods/normal.jar',
        name: 'normal.jar',
        category: 'mods',
        size: 100,
        isDir: false,
        sha256: 'ddd',
        downloadOnce: false,
      },
    ]);

    const result = await generate('my-build', strapi as never);
    expect(result['mods'][0].downloadOnce).toBeUndefined();
  });

  test('accumulates totalSize correctly', async () => {
    const { strapi, buildUpdate } = makeStrapi([
      {
        relativePath: 'mods/a.jar',
        name: 'a.jar',
        category: 'mods',
        size: 1000,
        isDir: false,
        sha256: 'aaa',
        downloadOnce: false,
      },
      {
        relativePath: 'mods/b.jar',
        name: 'b.jar',
        category: 'mods',
        size: '2000',
        isDir: false,
        sha256: 'bbb',
        downloadOnce: false,
      },
    ]);

    await generate('my-build', strapi as never);

    expect(buildUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ totalSize: '3000', filesCount: 2 }),
      }),
    );
  });

  test('handles null/undefined size gracefully', async () => {
    const { strapi, buildUpdate } = makeStrapi([
      {
        relativePath: 'mods/x.jar',
        name: 'x.jar',
        category: 'mods',
        size: null,
        isDir: false,
        sha256: 'eee',
        downloadOnce: false,
      },
    ]);

    await generate('my-build', strapi as never);

    expect(buildUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ totalSize: '0' }),
      }),
    );
  });

  test('uses root as fallback category when category is missing', async () => {
    const { strapi } = makeStrapi([
      {
        relativePath: 'file.jar',
        name: 'file.jar',
        category: '',
        size: 100,
        isDir: false,
        sha256: 'fff',
        downloadOnce: false,
      },
    ]);

    const result = await generate('my-build', strapi as never);
    expect(result['root']).toBeDefined();
  });

  test('does not update build when no build record found', async () => {
    const entryFindMany = jest.fn().mockResolvedValue([]);
    const buildFindMany = jest.fn().mockResolvedValue([]);
    const buildUpdate = jest.fn();
    const queryMock = jest.fn().mockImplementation((model: string) => {
      if (model.includes('artifact')) return { findMany: entryFindMany };
      if (model.includes('build'))
        return { findMany: buildFindMany, update: buildUpdate };
      return { findMany: jest.fn().mockResolvedValue([]) };
    });
    const strapi = {
      db: { query: queryMock },
      plugin: () => ({ config: () => null }),
      config: { get: () => 'http://localhost:1337' },
    };

    await generate('ghost-build', strapi as never);
    expect(buildUpdate).not.toHaveBeenCalled();
  });
});
