import type { File } from "./File";
import type { ProductVariable } from "./ProductVariable";
import type { Upload } from "./Upload";

export interface Product {
  id: string;
  humanReadableName: string;
  level: string;
  experimental: boolean;
  files: File[];
  variables: ProductVariable[];
  uploads: Upload[];
}