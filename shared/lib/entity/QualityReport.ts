import type { FileQuality } from "./FileQuality";

export type ErrorLevel = "pass" | "info" | "warning" | "error";

export interface QualityReport {
  testId: string;
  result: ErrorLevel;
  exceptions: any;
  quality: FileQuality;
}
