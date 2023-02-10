import type { Site } from "./Site";
import type { Product } from "./Product";
import type { ErrorLevel } from "./QualityReport";

export interface SearchFile {
  uuid: string;
  measurementDate: string;
  site: Site;
  product: Product;
  size: number;
  volatile: boolean;
  legacy: boolean;
  errorLevel: ErrorLevel | null;
}
