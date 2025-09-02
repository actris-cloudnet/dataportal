import type { Site } from "./Site";
import type { Product } from "./Product";
import type { ErrorLevel } from "./QualityReport";
import type { InstrumentInfo } from "./Instrument";

export interface SearchFile {
  uuid: string;
  measurementDate: string;
  site: Site;
  product: Product;
  instrumentInfo: InstrumentInfo;
  size: number;
  volatile: boolean;
  legacy: boolean;
  errorLevel: ErrorLevel | null;
  tombstoneReason?: string | null;
}
