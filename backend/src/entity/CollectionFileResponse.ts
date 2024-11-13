import { ModelFile, RegularFile } from "./File";
import { ErrorLevel } from "./QualityReport";

export class CollectionFileResponse {
  uuid: string;
  measurementDate: Date;
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
  tombstoned: boolean;

  constructor(file: RegularFile | ModelFile) {
    this.uuid = file.uuid;
    this.measurementDate = file.measurementDate;
    this.site = file.site.humanReadableName;
    this.siteId = file.site.id;
    this.product = file.product.humanReadableName;
    this.productId = file.product.id;
    this.modelId = "model" in file ? file.model.id : null;
    this.size = parseInt(file.size as unknown as string, 10);
    this.volatile = file.volatile;
    this.legacy = file.legacy;
    this.experimental = file.product.experimental;
    this.errorLevel = file.errorLevel;
    this.tombstoned = file.tombstoneReason != null;
  }
}
