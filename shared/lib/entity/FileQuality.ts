import type { QualityReport } from "./QualityReport";

export enum ErrorLevel {
  PASS = "pass",
  INFO = "info",
  WARNING = "warning",
  ERROR = "error",
}

export interface FileQuality {
  uuid: string;
  errorLevel: ErrorLevel;
  qcVersion: string;
  timestamp: Date;
  tests: number;
  errors: number;
  warnings: number;
  info: number;
  testReports: QualityReport[];
}
