import type { File } from "./File";
import type { ProductVariable } from "./ProductVariable";

export interface Dimensions {
  width: number;
  height: number;
  marginTop: number;
  marginRight: number;
  marginBottom: number;
  marginLeft: number;
}

export interface Visualization {
  s3key: string;
  sourceFile: File;
  productVariable: ProductVariable;
  width: number | null;
  height: number | null;
  marginTop: number | null;
  marginRight: number | null;
  marginBottom: number | null;
  marginLeft: number | null;
}
