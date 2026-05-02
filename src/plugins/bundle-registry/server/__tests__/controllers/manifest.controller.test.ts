jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
}));

jest.mock('../../services/storage', () => ({
  getManifestPath: jest.fn((slug: string) => `/builds/${slug}/artifacts.json`),
}));

import manifestController from '../../controllers/manifest';
import { existsSync, readFileSync } from 'fs';

const makeCtx = (slug: string) => ({
  params: { slug },
  notFound: jest.fn(),
  set: jest.fn(),
  body: null as unknown,
});

beforeEach(() => jest.clearAllMocks());

describe('manifest controller — getManifest', () => {
  const controller = manifestController({ strapi: {} as never });

  test('returns manifest JSON when file exists', async () => {
    const manifest = JSON.stringify({ mods: [] });
    (existsSync as jest.Mock).mockReturnValue(true);
    (readFileSync as jest.Mock).mockReturnValue(manifest);

    const ctx = makeCtx('my-build');
    await controller.getManifest(ctx as never);

    expect(ctx.body).toBe(manifest);
    expect(ctx.set).toHaveBeenCalledWith('Content-Type', 'application/json');
    expect(ctx.set).toHaveBeenCalledWith('Cache-Control', 'no-cache');
  });

  test('returns 404 when manifest file does not exist', async () => {
    (existsSync as jest.Mock).mockReturnValue(false);

    const ctx = makeCtx('missing-build');
    await controller.getManifest(ctx as never);

    expect(ctx.notFound).toHaveBeenCalledWith(expect.stringContaining('not found'));
    expect(ctx.body).toBeNull();
  });
});
