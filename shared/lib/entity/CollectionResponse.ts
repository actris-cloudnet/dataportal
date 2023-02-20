import type { CollectionFileResponse } from "./CollectionFileResponse";

export interface CollectionResponse {
  uuid: string;
  files: CollectionFileResponse[];
  title: string;
  pid: string;
  downloadCount: number;
  createdAt: Date;
  updatedAt: Date;
}
