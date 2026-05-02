export const ADMIN_BASE = '/bundle-registry' as const;
export const CONTENT_BASE = '/bundle-registry' as const;

export const ADMIN_ROUTES = {
  builds: `${ADMIN_BASE}/builds`,
  build: (slug: string) => `${ADMIN_BASE}/builds/${slug}`,
  upload: (slug: string) => `${ADMIN_BASE}/builds/${slug}/upload`,
  regenerate: (slug: string) => `${ADMIN_BASE}/builds/${slug}/regenerate`,
  validate: (slug: string) => `${ADMIN_BASE}/builds/${slug}/validate`,
  files: (slug: string) => `${ADMIN_BASE}/builds/${slug}/files`,
  bulkDelete: (slug: string) => `${ADMIN_BASE}/builds/${slug}/files/bulk-delete`,
  file: (slug: string, entryId: number) => `${ADMIN_BASE}/builds/${slug}/files/${entryId}`,
  rehash: (slug: string, entryId: number) => `${ADMIN_BASE}/builds/${slug}/files/${entryId}/rehash`,
} as const;
