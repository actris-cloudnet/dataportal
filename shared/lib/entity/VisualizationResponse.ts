import type { Dimensions } from "./Visualization";
import type { ProductVariable } from "./ProductVariable";
import type { InstrumentInfo } from "./Instrument";
import type { Model } from "./Model";

export interface VisualizationItem {
  s3key: string;
  productVariable: ProductVariable;
  dimensions: Dimensions | null;
}

export interface VisualizationResponse {
  sourceFileId: string;
  locationHumanReadable: string;
  productHumanReadable: string;
  volatile: boolean;
  legacy: boolean;
  experimental: boolean;
  visualizations: VisualizationItem[];
  source: InstrumentInfo | Model | null;
}
