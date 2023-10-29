import type { Site } from "./Site";
import type { Product } from "./Product";
import type { Visualization } from "./Visualization";
import type { Model } from "./Model";
import type { ModelVisualization } from "./ModelVisualization";
import type { ErrorLevel } from "./QualityReport";
import type { Software } from "./Software";
import type { Instrument } from "./Instrument";

export enum Timeliness {
  NRT = "nrt",
  RRT = "rrt",
  SCHEDULED = "scheduled",
}

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
}

export interface RegularFile extends File {
  sourceFileIds: string[] | null;
  visualizations: Visualization[];
  instrumentPid: string;
  instrument: Instrument;
}

export interface ModelFile extends File {
  model: Model;
  visualizations: ModelVisualization[];
}
