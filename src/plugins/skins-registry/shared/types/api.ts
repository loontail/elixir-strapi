import type { PlayerSkin, PlayerCape } from './entities';

export interface SkinResponse {
  skin?: PlayerSkin;
  cape?: PlayerCape;
}

export interface UploadResult {
  id: number;
  userId: number;
  fileUrl: string;
}

export interface ListResponse<T> {
  data: T[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}
