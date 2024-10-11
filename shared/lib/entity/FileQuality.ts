import type { QualityReport } from "./QualityReport";

export type ErrorLevel = "pass" | "info" | "warning" | "error";

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
