import type { File } from "./File";
import type { Instrument } from "./Instrument";
import type { ProductVariable } from "./ProductVariable";
import type { Upload } from "./Upload";

export type ProductType = "instrument" | "model" | "evaluation" | "experimental" | "geophysical";

export interface Product {
  id: string;
  humanReadableName: string;
  level: string;
  experimental: boolean;
  files: File[];
  type: ProductType[];
  variables: ProductVariable[];
  uploads: Upload[];
  sourceInstruments: Instrument[];
  sourceProducts: Product[];
  derivedProducts: Product[];
}
