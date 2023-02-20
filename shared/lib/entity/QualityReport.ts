import type { FileQuality } from "./FileQuality";

export enum ErrorLevel {
  PASS = "pass",
  INFO = "info",
  WARNING = "warning",
  ERROR = "error",
}

export interface QualityReport {
  testId: string;
  result: ErrorLevel;
  exceptions: any;
  quality: FileQuality;
}
