import type { Core } from '@strapi/strapi';

export type StrapiInstance = Core.Strapi;

export interface FormidableFile {
  filepath: string;
  originalFilename: string | null;
  mimetype: string | null;
  size: number;
}

export interface KoaContext {
  params: Record<string, string>;
  request: {
    body: unknown;
    files?: Record<string, FormidableFile | FormidableFile[] | undefined>;
  };
  body: unknown;
  status: number;
  notFound(msg?: string): void;
  badRequest(msg?: string): void;
  internalServerError(msg?: string): void;
  set(key: string, value: string): void;
}
