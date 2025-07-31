import type { Site } from "./Site";
import type { InstrumentInfo } from "./Instrument";
import type { Model } from "./Model";

export type Status = "created" | "uploaded" | "processed" | "invalid";

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
  tags: string[];
}

export interface InstrumentUpload extends Upload {
  instrument: InstrumentInfo;
}

export interface ModelUpload extends Upload {
  model: Model;
  filename: string;
}
