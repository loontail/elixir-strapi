import type { Core } from '@strapi/strapi';

export type StrapiInstance = Core.Strapi;

export interface KoaContext {
  query: Record<string, string | string[] | undefined>;
  params: Record<string, string>;
  request: { body: unknown };
  body: unknown;
  status: number;
  notFound(msg?: string): void;
  badRequest(msg?: string): void;
  internalServerError(msg?: string): void;
  set(key: string, value: string): void;
}
