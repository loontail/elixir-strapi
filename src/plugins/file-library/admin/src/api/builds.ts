import { request } from '@strapi/helper-plugin';
import type { Build } from '../../../shared/types/entities';
import type {
  CreateBuildDto,
  UpdateBuildDto,
  UpdateFileDto,
  ValidateResult,
} from '../../../shared/types/api';

// Admin plugin routes are mounted at /${pluginName}/... by Strapi.
// request() prepends backendURL directly, so we include the full path.
const BASE = '/file-library';

export const buildsApi = {
  findMany: (): Promise<Build[]> =>
    request(`${BASE}/builds`, { method: 'GET' }) as Promise<Build[]>,

  findOne: (slug: string): Promise<Build> =>
    request(`${BASE}/builds/${slug}`, { method: 'GET' }) as Promise<Build>,

  create: (data: CreateBuildDto): Promise<Build> =>
    request(`${BASE}/builds`, { method: 'POST', body: data }) as Promise<Build>,

  update: (slug: string, data: UpdateBuildDto): Promise<Build> =>
    request(`${BASE}/builds/${slug}`, { method: 'PUT', body: data }) as Promise<Build>,

  delete: (slug: string): Promise<void> =>
    request(`${BASE}/builds/${slug}`, { method: 'DELETE' }) as Promise<void>,

  regenerate: (slug: string): Promise<Build> =>
    request(`${BASE}/builds/${slug}/regenerate`, { method: 'POST' }) as Promise<Build>,

  deleteFile: (slug: string, entryId: number): Promise<void> =>
    request(`${BASE}/builds/${slug}/files/${entryId}`, { method: 'DELETE' }) as Promise<void>,

  updateFile: (slug: string, entryId: number, data: UpdateFileDto): Promise<Build> =>
    request(`${BASE}/builds/${slug}/files/${entryId}`, {
      method: 'PUT',
      body: data,
    }) as Promise<Build>,

  renameFile: (slug: string, entryId: number, newRelativePath: string): Promise<Build> =>
    request(`${BASE}/builds/${slug}/files/${entryId}`, {
      method: 'PATCH',
      body: { newRelativePath },
    }) as Promise<Build>,

  rehashFile: (slug: string, entryId: number): Promise<Build> =>
    request(`${BASE}/builds/${slug}/files/${entryId}/rehash`, { method: 'POST' }) as Promise<Build>,

  bulkDeleteFiles: (slug: string, ids: number[]): Promise<{ deleted: number }> =>
    request(`${BASE}/builds/${slug}/files/bulk-delete`, {
      method: 'POST',
      body: { ids },
    }) as Promise<{ deleted: number }>,

  validate: (slug: string): Promise<ValidateResult> =>
    request(`${BASE}/builds/${slug}/validate`, { method: 'POST' }) as Promise<ValidateResult>,
};

/** Multipart upload helper (fetch instead of request() because FormData isn't supported). */
const multipartPost = async (url: string, formData: FormData): Promise<unknown> => {
  const rawToken: string | null =
    sessionStorage.getItem('jwtToken') || localStorage.getItem('jwtToken');
  const token = rawToken ? (JSON.parse(rawToken) as string | null) : null;
  const res = await fetch(url, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({ error: { message: 'Request failed' } }))) as {
      error?: { message?: string };
    };
    throw new Error(err?.error?.message || 'Request failed');
  }
  return res.json();
};

export const uploadArchive = (slug: string, file: File): Promise<unknown> => {
  const fd = new FormData();
  fd.append('archive', file);
  return multipartPost(`/file-library/builds/${slug}/upload`, fd);
};

export const uploadFile = (slug: string, file: File, targetPath: string): Promise<unknown> => {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('targetPath', targetPath);
  return multipartPost(`/file-library/builds/${slug}/files`, fd);
};
