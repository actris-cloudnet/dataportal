import type { ErrorLevel } from "./QualityReport";

export interface SearchFileResponse {
  uuid: string;
  measurementDate: string;
  site: string;
  siteId: string;
  product: string;
  productId: string;
  size: number;
  volatile: boolean;
  legacy: boolean;
  errorLevel: ErrorLevel | null;
}
