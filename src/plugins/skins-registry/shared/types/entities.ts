export interface PlayerSkin {
  id: number;
  userId: number;
  username?: string;
  filePath: string;
  fileUrl: string;
  fileSize?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PlayerCape {
  id: number;
  userId: number;
  username?: string;
  filePath: string;
  fileUrl: string;
  fileSize?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type AssetType = 'skin' | 'cape';
