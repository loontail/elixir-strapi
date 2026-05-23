import {
  ApiEndpoints,
  FetchHttpClient,
  MinecraftChannels,
  MinecraftKitError,
  asMinecraftVersionId,
} from '@loontail/minecraft-kit';
import { getKit } from '../services/kitContainer';

import type { KoaContext, StrapiInstance } from '../types';

const UPSTREAM_ERROR_STATUS = 502;
const UPSTREAM_ERROR_CODE = 'UPSTREAM_FETCH_FAILED';

const queryString = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? value[0] ?? '' : value ?? '';

const sendUpstreamError = (ctx: KoaContext, err: unknown): void => {
  const message = err instanceof Error ? err.message : 'Upstream fetch failed';
  const code = err instanceof MinecraftKitError ? err.code : 'UNKNOWN';
  ctx.status = UPSTREAM_ERROR_STATUS;
  ctx.body = {
    error: {
      code: UPSTREAM_ERROR_CODE,
      message,
      details: { code },
    },
  };
};

// The kit doesn't currently expose a high-level API for the Fabric game-versions
// endpoint (it only lists loaders), but the URL builder and HTTP client are
// public. Use them directly so the picker can list Fabric-supported games.
interface FabricGameVersionEntry {
  readonly version: string;
  readonly stable: boolean;
}

let fabricHttp: FetchHttpClient | null = null;
const getFabricHttp = (): FetchHttpClient => {
  if (!fabricHttp) fabricHttp = new FetchHttpClient();
  return fabricHttp;
};

const fetchFabricGameVersions = async (): Promise<readonly FabricGameVersionEntry[]> => {
  const res = await getFabricHttp().request(ApiEndpoints.fabric.gameVersions());
  if (res.status >= 400) {
    throw new MinecraftKitError(
      'NETWORK_HTTP_ERROR',
      `Fabric game-versions fetch failed (${res.status})`,
      { context: { url: ApiEndpoints.fabric.gameVersions(), httpStatus: res.status } },
    );
  }
  return res.json<readonly FabricGameVersionEntry[]>();
};

const minecraftVersionsController = (_: { strapi: StrapiInstance }) => ({
  async listMinecraft(ctx: KoaContext) {
    try {
      const typeFilter = queryString(ctx.query.type);
      const kit = getKit();
      const summaries =
        typeFilter === 'all'
          ? await kit.versions.minecraft.list()
          : await kit.versions.minecraft.list({ channel: MinecraftChannels.RELEASE });
      ctx.body = {
        versions: summaries.map(({ id, type, releaseTime }) => ({ id, type, releaseTime })),
      };
    } catch (err) {
      sendUpstreamError(ctx, err);
    }
  },

  async listForge(ctx: KoaContext) {
    try {
      const minecraftFilter = queryString(ctx.query.minecraft);
      if (!minecraftFilter) {
        ctx.body = { versions: [] };
        return;
      }
      const builds = await getKit().versions.forge.list({
        minecraftVersion: asMinecraftVersionId(minecraftFilter),
      });
      // The kit returns one summary per Forge build; project to bare version strings
      // (e.g. `47.2.0`) for the picker UI.
      ctx.body = { versions: builds.map((b) => b.forgeVersion) };
    } catch (err) {
      sendUpstreamError(ctx, err);
    }
  },

  async listFabric(ctx: KoaContext) {
    try {
      const kit = getKit();
      const [loaderSummaries, gameVersions] = await Promise.all([
        kit.versions.fabric.list(),
        fetchFabricGameVersions(),
      ]);
      ctx.body = {
        loaderVersions: loaderSummaries.map(({ version, stable }) => ({ version, stable })),
        gameVersions: gameVersions.filter((g) => g.stable).map((g) => g.version),
      };
    } catch (err) {
      sendUpstreamError(ctx, err);
    }
  },

  async listRuntime(ctx: KoaContext) {
    try {
      const kit = getKit();
      const entries = await kit.versions.runtime.list({ system: kit.targets.system });
      // The picker needs `{ component, version }` per component, taking the first
      // variant per component (kit returns one entry per platform/variant).
      const seen = new Set<string>();
      const runtimes: Array<{ component: string; version: string }> = [];
      for (const entry of entries) {
        if (seen.has(entry.component)) continue;
        seen.add(entry.component);
        runtimes.push({ component: entry.component, version: entry.versionName });
      }
      ctx.body = { runtimes };
    } catch (err) {
      sendUpstreamError(ctx, err);
    }
  },

  // Returns the runtime component Mojang officially recommends for a given
  // Minecraft version (read from the per-version manifest's `javaVersion`).
  // The runtime-version-picker uses this to highlight a "recommended" option
  // — the admin can still pick a different component, but the default is now
  // visible at glance and matches what `kit.targets.resolve()` would pick if
  // the field was empty.
  async recommendRuntime(ctx: KoaContext) {
    try {
      const minecraftFilter = queryString(ctx.query.minecraft);
      if (!minecraftFilter) {
        ctx.body = { component: null, majorVersion: null };
        return;
      }
      const kit = getKit();
      const resolved = await kit.versions.minecraft.resolve({
        version: asMinecraftVersionId(minecraftFilter),
      });
      const java = resolved.manifest.javaVersion;
      ctx.body = {
        component: java?.component ?? null,
        majorVersion: java?.majorVersion ?? null,
      };
    } catch (err) {
      sendUpstreamError(ctx, err);
    }
  },
});

export default minecraftVersionsController;
