import { useMemo } from 'react';
import { useFetchClient } from '@strapi/strapi/admin';

const BASE = '/minecraft-versions';

export interface MinecraftVersionEntry {
  id: string;
  type: string;
  releaseTime: string;
}

export interface FabricLoaderVersion {
  version: string;
  stable: boolean;
}

export interface FabricVersionsResponse {
  loaderVersions: FabricLoaderVersion[];
  gameVersions: string[];
}

export interface RuntimeEntry {
  component: string;
  version: string;
}

export interface RuntimeRecommendation {
  component: string | null;
  majorVersion: number | null;
}

export interface VersionsApi {
  fetchMinecraft: (type?: 'release' | 'all') => Promise<MinecraftVersionEntry[]>;
  fetchForge: (minecraft: string) => Promise<string[]>;
  fetchFabric: () => Promise<FabricVersionsResponse>;
  fetchRuntime: () => Promise<RuntimeEntry[]>;
  recommendRuntime: (minecraft: string) => Promise<RuntimeRecommendation>;
}

interface MinecraftResponse {
  versions: MinecraftVersionEntry[];
}

interface ForgeResponse {
  versions: string[];
}

interface RuntimeResponse {
  runtimes: RuntimeEntry[];
}

export const useVersionsApi = (): VersionsApi => {
  const { get } = useFetchClient();

  return useMemo<VersionsApi>(
    () => ({
      fetchMinecraft: async (type) => {
        const qs = type === 'all' ? '?type=all' : '';
        const res = await get<MinecraftResponse>(`${BASE}/minecraft${qs}`);
        return Array.isArray(res.data?.versions) ? res.data.versions : [];
      },
      fetchForge: async (minecraft) => {
        if (!minecraft) return [];
        const res = await get<ForgeResponse>(
          `${BASE}/forge?minecraft=${encodeURIComponent(minecraft)}`,
        );
        return Array.isArray(res.data?.versions) ? res.data.versions : [];
      },
      fetchFabric: async () => {
        const res = await get<FabricVersionsResponse>(`${BASE}/fabric`);
        const data = res.data;
        return {
          loaderVersions: Array.isArray(data?.loaderVersions) ? data.loaderVersions : [],
          gameVersions: Array.isArray(data?.gameVersions) ? data.gameVersions : [],
        };
      },
      fetchRuntime: async () => {
        const res = await get<RuntimeResponse>(`${BASE}/runtime`);
        return Array.isArray(res.data?.runtimes) ? res.data.runtimes : [];
      },
      recommendRuntime: async (minecraft) => {
        if (!minecraft) return { component: null, majorVersion: null };
        const res = await get<RuntimeRecommendation>(
          `${BASE}/runtime/recommend?minecraft=${encodeURIComponent(minecraft)}`,
        );
        return {
          component: typeof res.data?.component === 'string' ? res.data.component : null,
          majorVersion:
            typeof res.data?.majorVersion === 'number' ? res.data.majorVersion : null,
        };
      },
    }),
    [get],
  );
};
