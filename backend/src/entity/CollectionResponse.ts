import { Collection } from "./Collection";
import { convertToCollectionFileResponse } from "../lib";
import { ModelFile, RegularFile } from "./File";
import { CollectionFileResponse } from "./CollectionFileResponse";

export class CollectionResponse {
  uuid: string;
  files: CollectionFileResponse[];
  title: string;
  pid: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(coll: Collection) {
    const sortedFiles = (coll.regularFiles as unknown as (RegularFile | ModelFile)[])
      .concat(coll.modelFiles)
      .sort((a, b) => (a.measurementDate > b.measurementDate ? 1 : -1));
    this.uuid = coll.uuid;
    this.files = sortedFiles.map(convertToCollectionFileResponse);
    this.title = coll.title;
    this.pid = coll.pid;
    this.createdAt = coll.createdAt;
    this.updatedAt = coll.updatedAt;
  }
}
