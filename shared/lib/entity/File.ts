import type { Site } from "./Site";
import type { Product } from "./Product";
import type { Model } from "./Model";
import type { ErrorLevel } from "./QualityReport";
import type { Software } from "./Software";
import type { Instrument } from "./Instrument";

export type Timeliness = "nrt" | "rrt" | "scheduled";

export interface File {
  uuid: string;
  s3key: string;
  version: string;
  pid: string;
  volatile: boolean;
  legacy: boolean;
  timeliness: Timeliness;
  measurementDate: string;
  site: Site;
  checksum: string;
  size: number;
  format: string;
  product: Product;
  errorLevel: ErrorLevel | null;
  createdAt: Date;
  updatedAt: Date;
  startTime: Date | null;
  stopTime: Date | null;
  filename: string;
  downloadUrl: string;
  software: Software[];
  dvasId: number | null;
  tombstoneReason: string | null;
}

export interface RegularFile extends File {
  sourceFileIds: string[];
  instrument: Instrument | null;
}

export interface ModelFile extends File {
  model: Model;
}
