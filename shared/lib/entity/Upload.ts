import type { Site } from "./Site";
import type { Instrument } from "./Instrument";
import type { Model } from "./Model";

export enum Status {
  CREATED = "created",
  UPLOADED = "uploaded",
  PROCESSED = "processed",
  INVALID = "invalid",
}

export type UploadOptions = {
  checksum: string;
  filename: string;
  measurementDate: string;
  site: Site;
  status: Status;
};

export interface Upload {
  uuid: string;
  checksum: string;
  filename: string;
  measurementDate: Date;
  size: number;
  status: Status;
  createdAt: Date;
  updatedAt: Date;
  site: Site;
  downloadUrl: string;
}

export interface InstrumentUpload extends Upload {
  instrument: Instrument;
  instrumentPid: string | null;
}

export interface ModelUpload extends Upload {
  model: Model;
  filename: string;
}
