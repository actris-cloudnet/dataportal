import type { CollectionFileResponse } from "./CollectionFileResponse";

export interface CollectionResponse {
  uuid: string;
  files: CollectionFileResponse[];
  title: string;
  pid: string;
  createdAt: Date;
  updatedAt: Date;
}
