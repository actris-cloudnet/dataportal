import type { ErrorLevel } from "./QualityReport";

export interface CollectionFileResponse {
  uuid: string;
  measurementDate: string;
  site: string;
  siteId: string;
  product: string;
  productId: string;
  modelId: string | null;
  size: number;
  volatile: boolean;
  legacy: boolean;
  experimental: boolean;
  errorLevel: ErrorLevel | null;
}
