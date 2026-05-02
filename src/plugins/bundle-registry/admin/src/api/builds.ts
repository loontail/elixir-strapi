import type { Build } from '../../../shared/types/entities';
import type {
  CreateBuildDto,
  UpdateBuildDto,
  UpdateFileDto,
  ValidateResult,
} from '../../../shared/types/api';

// Admin plugin routes are mounted at /${pluginName}/... by Strapi.
const BASE = '/bundle-registry';

const getAuthToken = (): string | null => {
  const raw = sessionStorage.getItem('jwtToken') || localStorage.getItem('jwtToken');
  return raw ? (JSON.parse(raw) as string | null) : null;
};

const authFetch = async <T>(
  url: string,
  options: RequestInit = {},
): Promise<T> => {
  const token = getAuthToken();
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string> | undefined),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { message: 'Request failed' } })) as {
      error?: { message?: string };
    };
    throw new Error(err?.error?.message || 'Request failed');
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
};

export const buildsApi = {
  findMany: (): Promise<Build[]> =>
    authFetch<Build[]>(`${BASE}/builds`, { method: 'GET' }),

  findOne: (slug: string): Promise<Build> =>
    authFetch<Build>(`${BASE}/builds/${slug}`, { method: 'GET' }),

  create: (data: CreateBuildDto): Promise<Build> =>
    authFetch<Build>(`${BASE}/builds`, { method: 'POST', body: JSON.stringify(data) }),

  update: (slug: string, data: UpdateBuildDto): Promise<Build> =>
    authFetch<Build>(`${BASE}/builds/${slug}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (slug: string): Promise<void> =>
    authFetch<void>(`${BASE}/builds/${slug}`, { method: 'DELETE' }),

  regenerate: (slug: string): Promise<Build> =>
    authFetch<Build>(`${BASE}/builds/${slug}/regenerate`, { method: 'POST' }),

  deleteFile: (slug: string, entryId: number): Promise<void> =>
    authFetch<void>(`${BASE}/builds/${slug}/files/${entryId}`, { method: 'DELETE' }),

  updateFile: (slug: string, entryId: number, data: UpdateFileDto): Promise<Build> =>
    authFetch<Build>(`${BASE}/builds/${slug}/files/${entryId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  renameFile: (slug: string, entryId: number, newRelativePath: string): Promise<Build> =>
    authFetch<Build>(`${BASE}/builds/${slug}/files/${entryId}`, {
      method: 'PATCH',
      body: JSON.stringify({ newRelativePath }),
    }),

  rehashFile: (slug: string, entryId: number): Promise<Build> =>
    authFetch<Build>(`${BASE}/builds/${slug}/files/${entryId}/rehash`, { method: 'POST' }),

  bulkDeleteFiles: (slug: string, ids: number[]): Promise<{ deleted: number }> =>
    authFetch<{ deleted: number }>(`${BASE}/builds/${slug}/files/bulk-delete`, {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),

  validate: (slug: string): Promise<ValidateResult> =>
    authFetch<ValidateResult>(`${BASE}/builds/${slug}/validate`, { method: 'POST' }),

  diskSpace: (): Promise<{ free: number | null; total: number | null }> =>
    authFetch<{ free: number | null; total: number | null }>(`${BASE}/disk-space`, { method: 'GET' }),
};

/** Multipart upload helper (uses fetch with manual auth because FormData doesn't set Content-Type). */
const multipartPost = async (url: string, formData: FormData): Promise<unknown> => {
  const token = getAuthToken();
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
  return multipartPost(`/bundle-registry/builds/${slug}/upload`, fd);
};

export const uploadFile = (slug: string, file: File, targetPath: string): Promise<unknown> => {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('targetPath', targetPath);
  return multipartPost(`/bundle-registry/builds/${slug}/files`, fd);
};
