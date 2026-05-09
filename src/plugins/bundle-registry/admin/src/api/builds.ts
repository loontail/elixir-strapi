import { useMemo } from 'react';
import { useFetchClient } from '@strapi/strapi/admin';
import type { Build } from '../../../shared/types/entities';
import type {
  CreateBuildDto,
  UpdateBuildDto,
  UpdateFileDto,
  ValidateResult,
} from '../../../shared/types/api';

const BASE = '/bundle-registry';

export interface BuildsApi {
  findMany: () => Promise<Build[]>;
  findOne: (slug: string) => Promise<Build>;
  create: (data: CreateBuildDto) => Promise<Build>;
  update: (slug: string, data: UpdateBuildDto) => Promise<Build>;
  delete: (slug: string) => Promise<void>;
  regenerate: (slug: string) => Promise<Build>;
  deleteFile: (slug: string, entryId: number) => Promise<void>;
  updateFile: (slug: string, entryId: number, data: UpdateFileDto) => Promise<Build>;
  renameFile: (slug: string, entryId: number, newRelativePath: string) => Promise<Build>;
  rehashFile: (slug: string, entryId: number) => Promise<Build>;
  bulkDeleteFiles: (slug: string, ids: number[]) => Promise<{ deleted: number }>;
  validate: (slug: string) => Promise<ValidateResult>;
  diskSpace: () => Promise<{ free: number | null; total: number | null }>;
  uploadArchive: (slug: string, file: File) => Promise<unknown>;
  uploadFile: (slug: string, file: File, targetPath: string) => Promise<unknown>;
}

export const useBuildsApi = (): BuildsApi => {
  const { get, post, put, del } = useFetchClient();

  return useMemo<BuildsApi>(
    () => ({
      findMany: async () => (await get<Build[]>(`${BASE}/builds`)).data,
      findOne: async (slug) => (await get<Build>(`${BASE}/builds/${slug}`)).data,
      create: async (data) => (await post<Build>(`${BASE}/builds`, data)).data,
      update: async (slug, data) => (await put<Build>(`${BASE}/builds/${slug}`, data)).data,
      delete: async (slug) => {
        await del(`${BASE}/builds/${slug}`);
      },
      regenerate: async (slug) =>
        (await post<Build>(`${BASE}/builds/${slug}/regenerate`)).data,
      deleteFile: async (slug, entryId) => {
        await del(`${BASE}/builds/${slug}/files/${entryId}`);
      },
      updateFile: async (slug, entryId, data) =>
        (await put<Build>(`${BASE}/builds/${slug}/files/${entryId}`, data)).data,
      renameFile: async (slug, entryId, newRelativePath) =>
        (
          await post<Build>(`${BASE}/builds/${slug}/files/${entryId}/rename`, { newRelativePath })
        ).data,
      rehashFile: async (slug, entryId) =>
        (await post<Build>(`${BASE}/builds/${slug}/files/${entryId}/rehash`)).data,
      bulkDeleteFiles: async (slug, ids) =>
        (
          await post<{ deleted: number }>(`${BASE}/builds/${slug}/files/bulk-delete`, { ids })
        ).data,
      validate: async (slug) =>
        (await post<ValidateResult>(`${BASE}/builds/${slug}/validate`)).data,
      diskSpace: async () =>
        (await get<{ free: number | null; total: number | null }>(`${BASE}/disk-space`)).data,
      uploadArchive: async (slug, file) => {
        const fd = new FormData();
        fd.append('archive', file);
        return (await post(`${BASE}/builds/${slug}/upload`, fd)).data;
      },
      uploadFile: async (slug, file, targetPath) => {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('targetPath', targetPath);
        return (await post(`${BASE}/builds/${slug}/files`, fd)).data;
      },
    }),
    [get, post, put, del],
  );
};
