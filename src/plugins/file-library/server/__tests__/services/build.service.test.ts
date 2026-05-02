import buildService from '../../services/build';

const makeQuery = () => ({
  findMany: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  deleteMany: jest.fn(),
});

const makeStrapi = () => {
  const query = makeQuery();
  const strapi = { db: { query: jest.fn().mockReturnValue(query) } };
  return { strapi, query };
};

beforeEach(() => jest.clearAllMocks());

describe('buildService.findMany', () => {
  test('returns builds ordered by createdAt desc', async () => {
    const { strapi, query } = makeStrapi();
    const builds = [{ id: 1 }, { id: 2 }];
    query.findMany.mockResolvedValue(builds);

    const service = buildService({ strapi } as never);
    const result = await service.findMany();

    expect(result).toEqual(builds);
    expect(query.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: 'desc' } }),
    );
  });
});

describe('buildService.findOne', () => {
  test('returns build when found', async () => {
    const { strapi, query } = makeStrapi();
    const build = { id: 1, slug: 'my-build' };
    query.findMany.mockResolvedValue([build]);

    const service = buildService({ strapi } as never);
    const result = await service.findOne('my-build');

    expect(result).toEqual(build);
    expect(query.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { slug: 'my-build' }, limit: 1 }),
    );
  });

  test('returns null when not found', async () => {
    const { strapi, query } = makeStrapi();
    query.findMany.mockResolvedValue([]);

    const service = buildService({ strapi } as never);
    const result = await service.findOne('missing');

    expect(result).toBeNull();
  });
});

describe('buildService.create', () => {
  test('creates a build record', async () => {
    const { strapi, query } = makeStrapi();
    const newBuild = { id: 1, name: 'Test', slug: 'test' };
    query.create.mockResolvedValue(newBuild);

    const service = buildService({ strapi } as never);
    const result = await service.create({ name: 'Test', slug: 'test' });

    expect(result).toEqual(newBuild);
    expect(query.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ slug: 'test' }) }),
    );
  });
});

describe('buildService.update', () => {
  test('updates a build by id', async () => {
    const { strapi, query } = makeStrapi();
    const updated = { id: 1, name: 'Updated' };
    query.update.mockResolvedValue(updated);

    const service = buildService({ strapi } as never);
    const result = await service.update(1, { name: 'Updated' });

    expect(result).toEqual(updated);
    expect(query.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 1 }, data: { name: 'Updated' } }),
    );
  });
});

describe('buildService.delete', () => {
  test('deletes a build by id', async () => {
    const { strapi, query } = makeStrapi();
    query.delete.mockResolvedValue(undefined);

    const service = buildService({ strapi } as never);
    await service.delete(1);

    expect(query.delete).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 1 } }));
  });
});

describe('buildService.deleteFileEntries', () => {
  test('fetches entry ids then bulk-deletes them', async () => {
    const { strapi, query } = makeStrapi();
    query.findMany.mockResolvedValue([{ id: 10 }, { id: 11 }]);
    query.deleteMany.mockResolvedValue(undefined);

    const service = buildService({ strapi } as never);
    await service.deleteFileEntries(42);

    expect(query.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { build: 42 } }),
    );
    expect(query.deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: { $in: [10, 11] } } }),
    );
  });

  test('skips deleteMany when no entries exist', async () => {
    const { strapi, query } = makeStrapi();
    query.findMany.mockResolvedValue([]);

    const service = buildService({ strapi } as never);
    await service.deleteFileEntries(99);

    expect(query.deleteMany).not.toHaveBeenCalled();
  });
});

describe('buildService.createFileEntries', () => {
  test('creates an entry for each scan result', async () => {
    const { strapi, query } = makeStrapi();
    query.create.mockResolvedValue({});

    const service = buildService({ strapi } as never);
    const entries = [
      {
        relativePath: 'mods/a.jar',
        name: 'a.jar',
        category: 'mods',
        size: 100,
        sha256: 'aaa',
        isDir: false,
        fileModifiedAt: '2024-01-01T00:00:00.000Z',
      },
      {
        relativePath: 'mods/b.jar',
        name: 'b.jar',
        category: 'mods',
        size: 200,
        sha256: 'bbb',
        isDir: false,
        fileModifiedAt: undefined,
      },
    ];
    await service.createFileEntries(1, entries);

    expect(query.create).toHaveBeenCalledTimes(2);
  });

  test('creates no entries for empty array', async () => {
    const { strapi, query } = makeStrapi();
    const service = buildService({ strapi } as never);
    await service.createFileEntries(1, []);
    expect(query.create).not.toHaveBeenCalled();
  });
});

describe('buildService.upsertFileEntries', () => {
  test('updates existing entries and creates new ones', async () => {
    const { strapi, query } = makeStrapi();
    query.findMany.mockResolvedValue([{ id: 5, relativePath: 'mods/existing.jar' }]);
    query.update.mockResolvedValue({});
    query.create.mockResolvedValue({});

    const service = buildService({ strapi } as never);
    await service.upsertFileEntries(1, [
      {
        relativePath: 'mods/existing.jar',
        name: 'existing.jar',
        category: 'mods',
        size: 100,
        sha256: 'aaa',
        isDir: false,
        fileModifiedAt: undefined,
      },
      {
        relativePath: 'mods/new.jar',
        name: 'new.jar',
        category: 'mods',
        size: 200,
        sha256: 'bbb',
        isDir: false,
        fileModifiedAt: undefined,
      },
    ]);

    expect(query.update).toHaveBeenCalledTimes(1);
    expect(query.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 5 } }),
    );
    expect(query.create).toHaveBeenCalledTimes(1);
  });

  test('only creates when no existing entries', async () => {
    const { strapi, query } = makeStrapi();
    query.findMany.mockResolvedValue([]);
    query.create.mockResolvedValue({});

    const service = buildService({ strapi } as never);
    await service.upsertFileEntries(1, [
      {
        relativePath: 'new.jar',
        name: 'new.jar',
        category: 'root',
        size: 50,
        sha256: 'ccc',
        isDir: false,
        fileModifiedAt: undefined,
      },
    ]);

    expect(query.update).not.toHaveBeenCalled();
    expect(query.create).toHaveBeenCalledTimes(1);
  });
});
