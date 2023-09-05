import { SearchFile } from "./SearchFile";
import { ErrorLevel } from "./QualityReport";

export class SearchFileResponse {
  uuid: string;
  measurementDate: Date;
  site: string;
  siteId: string;
  product: string;
  productId: string;
  size: number;
  volatile: boolean;
  legacy: boolean;
  experimental: boolean;
  errorLevel: ErrorLevel | null;
  instrument: string | null;
  instrumentId: string | null;

  constructor(file: SearchFile) {
    this.uuid = file.uuid;
    this.measurementDate = file.measurementDate;
    this.site = file.site.humanReadableName;
    this.siteId = file.site.id;
    this.product = file.product.humanReadableName;
    this.productId = file.product.id;
    this.size = file.size;
    this.volatile = file.volatile;
    this.legacy = file.legacy;
    this.experimental = file.product.experimental;
    this.errorLevel = file.errorLevel;
    this.instrument = file.instrument ? file.instrument.shortName || file.instrument.humanReadableName : null;
    this.instrumentId = file.instrument ? file.instrument.id : null;
  }
}
