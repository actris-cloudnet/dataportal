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

export const EARTHCARE_PRODUCT_PREFIX = "cpr-";
export const ESA_TERMS_URL =
  "https://earth.esa.int/eogateway/documents/20142/1564626/Terms-and-Conditions-for-the-use-of-ESA-Data.pdf";

export function isEarthCareProduct(productId: string): boolean {
  return productId.startsWith(EARTHCARE_PRODUCT_PREFIX);
}
