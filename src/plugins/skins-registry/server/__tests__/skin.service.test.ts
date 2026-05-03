import skinService, { buildWhereClause } from '../services/skin';

// ── buildWhereClause (pure) ──────────────────────────────────────────────────

describe('buildWhereClause', () => {
  it('returns empty object when no search term given', () => {
    expect(buildWhereClause()).toEqual({});
    expect(buildWhereClause('')).toEqual({});
  });

  it('returns $containsi clause for a non-empty search term', () => {
    expect(buildWhereClause('notch')).toEqual({
      $or: [{ username: { $containsi: 'notch' } }],
    });
  });
});

// ── Helpers ──────────────────────────────────────────────────────────────────

const makeMockQuery = () => ({
  findOne: jest.fn(),
  findMany: jest.fn(),
  count: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});

const makeMockStrapi = (skinQuery = makeMockQuery(), capeQuery = makeMockQuery()) => ({
  db: {
    query: jest.fn((uid: string) => {
      if (uid === 'plugin::skins-registry.player-skin') return skinQuery;
      if (uid === 'plugin::skins-registry.player-cape') return capeQuery;
      throw new Error(`Unexpected UID: ${uid}`);
    }),
  },
});

// ── findSkinByUserId ─────────────────────────────────────────────────────────

describe('skinService.findSkinByUserId', () => {
  it('queries the skin UID with correct userId', async () => {
    const skinQuery = makeMockQuery();
    skinQuery.findOne.mockResolvedValue({ id: 1, userId: 42 });
    const service = skinService({ strapi: makeMockStrapi(skinQuery) as never });

    const result = await service.findSkinByUserId(42);

    expect(skinQuery.findOne).toHaveBeenCalledWith({ where: { userId: 42 } });
    expect(result).toEqual({ id: 1, userId: 42 });
  });

  it('returns null when skin does not exist', async () => {
    const skinQuery = makeMockQuery();
    skinQuery.findOne.mockResolvedValue(null);
    const service = skinService({ strapi: makeMockStrapi(skinQuery) as never });

    expect(await service.findSkinByUserId(99)).toBeNull();
  });
});

// ── findCapeByUserId ─────────────────────────────────────────────────────────

describe('skinService.findCapeByUserId', () => {
  it('queries the cape UID with correct userId', async () => {
    const capeQuery = makeMockQuery();
    capeQuery.findOne.mockResolvedValue({ id: 2, userId: 5 });
    const service = skinService({ strapi: makeMockStrapi(makeMockQuery(), capeQuery) as never });

    const result = await service.findCapeByUserId(5);

    expect(capeQuery.findOne).toHaveBeenCalledWith({ where: { userId: 5 } });
    expect(result).toEqual({ id: 2, userId: 5 });
  });

  it('returns null when cape does not exist', async () => {
    const capeQuery = makeMockQuery();
    capeQuery.findOne.mockResolvedValue(null);
    const service = skinService({ strapi: makeMockStrapi(makeMockQuery(), capeQuery) as never });

    expect(await service.findCapeByUserId(99)).toBeNull();
  });
});

// ── upsertSkin ───────────────────────────────────────────────────────────────

describe('skinService.upsertSkin', () => {
  const data = { filePath: '/skins/1.png', fileUrl: '/skins-registry/skins/1.png', fileSize: 1234 };

  it('creates a new record when none exists', async () => {
    const skinQuery = makeMockQuery();
    skinQuery.findOne.mockResolvedValue(null);
    skinQuery.create.mockResolvedValue({ id: 1, userId: 1, ...data });
    const service = skinService({ strapi: makeMockStrapi(skinQuery) as never });

    await service.upsertSkin(1, data);

    expect(skinQuery.create).toHaveBeenCalledWith({ data: { userId: 1, ...data } });
    expect(skinQuery.update).not.toHaveBeenCalled();
  });

  it('updates the existing record when one exists', async () => {
    const skinQuery = makeMockQuery();
    skinQuery.findOne.mockResolvedValue({ id: 1, userId: 1 });
    skinQuery.update.mockResolvedValue({ id: 1, userId: 1, ...data });
    const service = skinService({ strapi: makeMockStrapi(skinQuery) as never });

    await service.upsertSkin(1, data);

    expect(skinQuery.update).toHaveBeenCalledWith({ where: { userId: 1 }, data });
    expect(skinQuery.create).not.toHaveBeenCalled();
  });
});

// ── upsertCape ───────────────────────────────────────────────────────────────

describe('skinService.upsertCape', () => {
  const data = { filePath: '/capes/1.png', fileUrl: '/skins-registry/capes/1.png', fileSize: 512 };

  it('creates a new cape record when none exists', async () => {
    const capeQuery = makeMockQuery();
    capeQuery.findOne.mockResolvedValue(null);
    capeQuery.create.mockResolvedValue({ id: 1, userId: 3, ...data });
    const service = skinService({ strapi: makeMockStrapi(makeMockQuery(), capeQuery) as never });

    await service.upsertCape(3, data);

    expect(capeQuery.create).toHaveBeenCalledWith({ data: { userId: 3, ...data } });
    expect(capeQuery.update).not.toHaveBeenCalled();
  });

  it('updates the existing cape record when one exists', async () => {
    const capeQuery = makeMockQuery();
    capeQuery.findOne.mockResolvedValue({ id: 1, userId: 3 });
    capeQuery.update.mockResolvedValue({ id: 1, userId: 3, ...data });
    const service = skinService({ strapi: makeMockStrapi(makeMockQuery(), capeQuery) as never });

    await service.upsertCape(3, data);

    expect(capeQuery.update).toHaveBeenCalledWith({ where: { userId: 3 }, data });
    expect(capeQuery.create).not.toHaveBeenCalled();
  });
});

// ── deleteSkinByUserId ───────────────────────────────────────────────────────

describe('skinService.deleteSkinByUserId', () => {
  it('deletes the record when it exists', async () => {
    const skinQuery = makeMockQuery();
    skinQuery.findOne.mockResolvedValue({ id: 5, userId: 10 });
    const service = skinService({ strapi: makeMockStrapi(skinQuery) as never });

    await service.deleteSkinByUserId(10);

    expect(skinQuery.delete).toHaveBeenCalledWith({ where: { userId: 10 } });
  });

  it('does nothing when the record does not exist', async () => {
    const skinQuery = makeMockQuery();
    skinQuery.findOne.mockResolvedValue(null);
    const service = skinService({ strapi: makeMockStrapi(skinQuery) as never });

    await service.deleteSkinByUserId(10);

    expect(skinQuery.delete).not.toHaveBeenCalled();
  });
});

// ── deleteCapeByUserId ───────────────────────────────────────────────────────

describe('skinService.deleteCapeByUserId', () => {
  it('deletes the cape record when it exists', async () => {
    const capeQuery = makeMockQuery();
    capeQuery.findOne.mockResolvedValue({ id: 7, userId: 20 });
    const service = skinService({ strapi: makeMockStrapi(makeMockQuery(), capeQuery) as never });

    await service.deleteCapeByUserId(20);

    expect(capeQuery.delete).toHaveBeenCalledWith({ where: { userId: 20 } });
  });

  it('does nothing when the cape record does not exist', async () => {
    const capeQuery = makeMockQuery();
    capeQuery.findOne.mockResolvedValue(null);
    const service = skinService({ strapi: makeMockStrapi(makeMockQuery(), capeQuery) as never });

    await service.deleteCapeByUserId(20);

    expect(capeQuery.delete).not.toHaveBeenCalled();
  });
});

// ── findManySkins ────────────────────────────────────────────────────────────

describe('skinService.findManySkins', () => {
  it('returns data and total with correct pagination offset', async () => {
    const skinQuery = makeMockQuery();
    const fakeData = [{ id: 1 }, { id: 2 }];
    skinQuery.findMany.mockResolvedValue(fakeData);
    skinQuery.count.mockResolvedValue(50);
    const service = skinService({ strapi: makeMockStrapi(skinQuery) as never });

    const result = await service.findManySkins({ page: 2, pageSize: 10 });

    expect(skinQuery.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 10, offset: 10 }),
    );
    expect(result).toEqual({ data: fakeData, total: 50 });
  });

  it('applies search filter via buildWhereClause', async () => {
    const skinQuery = makeMockQuery();
    skinQuery.findMany.mockResolvedValue([]);
    skinQuery.count.mockResolvedValue(0);
    const service = skinService({ strapi: makeMockStrapi(skinQuery) as never });

    await service.findManySkins({ search: 'steve' });

    expect(skinQuery.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { $or: [{ username: { $containsi: 'steve' } }] },
      }),
    );
  });
});

// ── findManyCapes ────────────────────────────────────────────────────────────

describe('skinService.findManyCapes', () => {
  it('queries the cape UID', async () => {
    const capeQuery = makeMockQuery();
    capeQuery.findMany.mockResolvedValue([]);
    capeQuery.count.mockResolvedValue(0);
    const strapi = makeMockStrapi(makeMockQuery(), capeQuery);
    const service = skinService({ strapi: strapi as never });

    await service.findManyCapes({ page: 1, pageSize: 25 });

    expect(strapi.db.query).toHaveBeenCalledWith('plugin::skins-registry.player-cape');
  });

  it('returns data and total for capes', async () => {
    const capeQuery = makeMockQuery();
    const fakeData = [{ id: 10 }];
    capeQuery.findMany.mockResolvedValue(fakeData);
    capeQuery.count.mockResolvedValue(1);
    const service = skinService({ strapi: makeMockStrapi(makeMockQuery(), capeQuery) as never });

    const result = await service.findManyCapes({ page: 1, pageSize: 25 });

    expect(result).toEqual({ data: fakeData, total: 1 });
  });
});
