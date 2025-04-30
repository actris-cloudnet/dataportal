export interface Calibration {
  measurementDate: string;
  data: any;
  createdAt: string;
  updatedAt: string;
}

export type CalibrationList = Record<string, Calibration[]>;
