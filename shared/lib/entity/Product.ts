import type { Instrument } from "./Instrument";
import type { ProductVariable } from "./ProductVariable";

export type ProductType = "instrument" | "model" | "evaluation" | "experimental" | "geophysical";

export interface Product {
  id: string;
  humanReadableName: string;
  experimental: boolean;
  downloadable: boolean;
  type: ProductType[];
  variables: ProductVariable[];
  sourceInstruments: Instrument[];
  sourceProducts: Product[];
  derivedProducts: Product[];
}
