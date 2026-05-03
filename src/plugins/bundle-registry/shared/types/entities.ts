export type BuildStatus = 'draft' | 'processing' | 'ready' | 'failed';

export interface Build {
  id: number;
  name: string;
  slug: string;
  description?: string;
  version?: string;
  status: BuildStatus;
  filesCount: number;
  totalSize: number;
  processingError?: string;
  lastGeneratedAt?: string;
  artifacts?: Artifact[];
}

export interface Artifact {
  id: number;
  relativePath: string;
  name: string;
  category: string;
  size: number;
  sha256?: string;
  isDir: boolean;
  downloadOnce: boolean;
  fileModifiedAt?: string;
  build?: Pick<Build, 'id' | 'slug'>;
}
