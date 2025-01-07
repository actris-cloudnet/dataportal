import type { Instrument } from "./Instrument";
import type { ProductVariable } from "./ProductVariable";

export type ProductType = "instrument" | "model" | "evaluation" | "experimental" | "geophysical";

export interface Product {
  id: string;
  humanReadableName: string;
  level: string;
  experimental: boolean;
  type: ProductType[];
  variables: ProductVariable[];
  sourceInstrumentIds: string[];
  sourceInstruments: Instrument[];
  sourceProducts: Product[];
  derivedProducts: Product[];
}
