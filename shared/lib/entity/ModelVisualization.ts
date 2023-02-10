import type { ModelFile } from "./File";
import type { ProductVariable } from "./ProductVariable";

export interface ModelVisualization {
  s3key: string;
  sourceFile: ModelFile;
  productVariable: ProductVariable;
  width: number | null;
  height: number | null;
  marginTop: number | null;
  marginRight: number | null;
  marginBottom: number | null;
  marginLeft: number | null;
}
