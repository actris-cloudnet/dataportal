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

export interface InstrumentPidLocation {
  siteId: string;
  humanReadableName: string;
  startDate: string;
  endDate: string;
}

export interface InstrumentInfo {
  uuid: string;
  pid: string;
  name: string;
  serialNumber: string | null;
  instrument: Instrument;
  locations: InstrumentPidLocation[];
  model: string;
  owners: string[];
  type: string;
  siteId: string;
  status: "active" | "recent" | "inactive";
}
