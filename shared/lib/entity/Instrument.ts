import type { InstrumentUpload } from "./Upload";
import type { Calibration } from "./Calibration";

export enum InstrumentType {
  RADAR = "radar",
  LIDAR = "lidar",
  MWR = "mwr",
  DISDROMETER = "disdrometer",
}

export interface Instrument {
  id: string;
  type: InstrumentType;
  humanReadableName: string;
  uploads: InstrumentUpload[];
  calibrations: Calibration[];
  shortName: string;
}
