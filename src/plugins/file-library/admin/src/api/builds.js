import { request } from '@strapi/helper-plugin';

// Admin plugin routes are mounted at /${pluginName}/... by Strapi.
// request() prepends backendURL directly, so we include the full path.
const BASE = '/file-library';

export const buildsApi = {
  findMany: () => request(`${BASE}/builds`, { method: 'GET' }),

  findOne: (slug) => request(`${BASE}/builds/${slug}`, { method: 'GET' }),

  create: (data) => request(`${BASE}/builds`, { method: 'POST', body: data }),

  update: (slug, data) => request(`${BASE}/builds/${slug}`, { method: 'PUT', body: data }),

  delete: (slug) => request(`${BASE}/builds/${slug}`, { method: 'DELETE' }),

  regenerate: (slug) => request(`${BASE}/builds/${slug}/regenerate`, { method: 'POST' }),

  deleteFile: (slug, entryId) =>
    request(`${BASE}/builds/${slug}/files/${entryId}`, { method: 'DELETE' }),

  updateFile: (slug, entryId, data) =>
    request(`${BASE}/builds/${slug}/files/${entryId}`, { method: 'PUT', body: data }),

  renameFile: (slug, entryId, newRelativePath) =>
    request(`${BASE}/builds/${slug}/files/${entryId}`, { method: 'PATCH', body: { newRelativePath } }),

  rehashFile: (slug, entryId) =>
    request(`${BASE}/builds/${slug}/files/${entryId}/rehash`, { method: 'POST' }),

  bulkDeleteFiles: (slug, ids) =>
    request(`${BASE}/builds/${slug}/files/bulk-delete`, { method: 'POST', body: { ids } }),

  validate: (slug) => request(`${BASE}/builds/${slug}/validate`, { method: 'POST' }),
};

/** Multipart upload helper (fetch instead of request() because FormData isn't supported). */
async function multipartPost(url, formData) {
  const token = JSON.parse(
    sessionStorage.getItem('jwtToken') || localStorage.getItem('jwtToken') || 'null'
  );
  const res = await fetch(url, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { message: 'Request failed' } }));
    throw new Error(err?.error?.message || 'Request failed');
  }
  return res.json();
}

export function uploadArchive(slug, file) {
  const fd = new FormData();
  fd.append('archive', file);
  return multipartPost(`/file-library/builds/${slug}/upload`, fd);
}

export function uploadFile(slug, file, targetPath) {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('targetPath', targetPath);
  return multipartPost(`/file-library/builds/${slug}/files`, fd);
}
