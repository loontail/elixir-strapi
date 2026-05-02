import type { LoadedStrapi } from '@strapi/strapi';

export type { LoadedStrapi as StrapiInstance };

export interface KoaContext {
  params: Record<string, string>;
  request: {
    body: unknown;
    files: Record<string, { type: string; name: string; path: string } | undefined>;
  };
  body: unknown;
  status: number;
  notFound(msg?: string): void;
  badRequest(msg?: string): void;
  internalServerError(msg?: string): void;
  set(key: string, value: string): void;
}
