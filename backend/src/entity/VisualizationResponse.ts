import { Visualization, Dimensions } from "./Visualization";
import { ModelVisualization } from "./ModelVisualization";
import { ModelFile, RegularFile } from "./File";
import { ProductVariable } from "./ProductVariable";

export interface VisualizationItem {
  s3key: string;
  productVariable: ProductVariable;
  dimensions: Dimensions | null;
}

export class VisualizationResponse {
  sourceFileId: string;
  locationHumanReadable: string;
  productHumanReadable: string;
  volatile: boolean;
  legacy: boolean;
  experimental: boolean;
  visualizations: VisualizationItem[];

  constructor(file: RegularFile | ModelFile) {
    this.sourceFileId = file.uuid;
    this.visualizations = (file.visualizations as (Visualization | ModelVisualization)[]).map((viz) => ({
      s3key: viz.s3key,
      productVariable: viz.productVariable,
      dimensions:
        viz.width != null &&
        viz.height != null &&
        viz.marginTop != null &&
        viz.marginRight != null &&
        viz.marginBottom != null &&
        viz.marginLeft != null
          ? {
              width: viz.width,
              height: viz.height,
              marginTop: viz.marginTop,
              marginRight: viz.marginRight,
              marginBottom: viz.marginBottom,
              marginLeft: viz.marginLeft,
            }
          : null,
    }));
    this.productHumanReadable = file.product.humanReadableName;
    this.locationHumanReadable = file.site.humanReadableName;
    this.volatile = file.volatile;
    this.legacy = file.legacy;
    this.experimental = file.product.experimental;
  }
}
