import type { FileEntry } from './entities';

export interface CreateBuildDto {
  name: string;
  slug: string;
  description?: string;
  version?: string;
}

export interface UpdateBuildDto {
  name?: string;
  description?: string;
  version?: string;
}

export interface UpdateFileDto {
  downloadOnce: boolean;
}

export interface RenameFileDto {
  newRelativePath: string;
}

export interface BulkDeleteDto {
  ids: number[];
}

export interface ValidateResult {
  missing: Array<Pick<FileEntry, 'id' | 'relativePath' | 'name'>>;
  orphaned: Array<{ relativePath: string }>;
}

export interface ManifestEntry {
  path: string;
  name: string;
  size: number;
  isDir: boolean;
  sha256?: string;
  url?: string;
  downloadOnce?: boolean;
}

export type Manifest = Record<string, ManifestEntry[]>;
