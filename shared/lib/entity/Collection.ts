import type { ModelFile, RegularFile } from "./File";

export interface Collection {
  uuid: string;
  regularFiles: RegularFile[];
  modelFiles: ModelFile[];
  title: string;
  pid: string;
  createdAt: Date;
  updatedAt: Date;
}
