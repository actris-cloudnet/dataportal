import type { Site } from "./Site";
import type { Instrument } from "./Instrument";

export interface CalibrationData {
  calibrationFactor: number;
  createdAt: Date;
}

export interface Calibration {
  id: number;
  instrument: Instrument;
  site: Site;
  measurementDate: Date;
  calibration: Array<CalibrationData>;
}
