import type { Site } from "./Site";
import type { Product } from "./Product";
import type { Visualization } from "./Visualization";
import type { Model } from "./Model";
import type { ModelVisualization } from "./ModelVisualization";
import type { ErrorLevel } from "./QualityReport";
import type { Software } from "./Software";
import type { Instrument, InstrumentInfo } from "./Instrument";

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
  visualizations: Visualization[];
  instrumentPid: string;
  instrumentInfo: InstrumentInfo | null;
  instrument: Instrument;
}

export interface ModelFile extends File {
  model: Model;
  visualizations: ModelVisualization[];
}
