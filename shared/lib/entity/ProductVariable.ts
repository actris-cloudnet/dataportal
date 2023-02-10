import type { Visualization } from "./Visualization";
import type { Product } from "./Product";

export interface ProductVariable {
  id: string;
  humanReadableName: string;
  order: string;
  actrisVocabUri: string | null;
  visualizations: Visualization[];
  product: Product;
}
