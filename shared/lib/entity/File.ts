import type { Site } from "./Site";
import type { Product } from "./Product";
import type { Visualization } from "./Visualization";
import type { Model } from "./Model";
import type { ModelVisualization } from "./ModelVisualization";
import type { ErrorLevel } from "./QualityReport";

export enum Quality {
  NRT = "nrt",
  QC = "qc",
}

export interface File {
  uuid: string;
  s3key: string;
  version: string;
  pid: string;
  volatile: boolean;
  legacy: boolean;
  quality: Quality;
  measurementDate: string;
  site: Site;
  checksum: string;
  size: number;
  format: string;
  product: Product;
  errorLevel: ErrorLevel | null;
  createdAt: Date;
  updatedAt: Date;
  processingVersion: string;
  filename: string;
  downloadUrl: string;
}

export interface RegularFile extends File {
  sourceFileIds: string[] | null;
  cloudnetpyVersion: string;
  visualizations: Visualization[];
  instrumentPid: string;
}

export interface ModelFile extends File {
  model: Model;
  visualizations: ModelVisualization[];
}