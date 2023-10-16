import type { Visualization } from "./Visualization";
import type { Product } from "./Product";

export interface ProductVariable {
  id: string;
  humanReadableName: string;
  order: string;
  actrisName: string | null;
  visualizations: Visualization[];
  product: Product;
}
