export type InstrumentType =
  | "radar"
  | "lidar"
  | "mwr"
  | "disdrometer"
  | "rain-radar"
  | "rain-gauge"
  | "weather-station"
  | "doppler-lidar";

export interface Instrument {
  id: string;
  name: string;
  pid: string;
  uuid: string;
  type: InstrumentType;
  humanReadableName: string;
  shortName: string;
  model: string;
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

export interface NominalInstrument {
  siteId: string;
  productId: string;
  measurementDate: string;
  nominalInstrument: InstrumentInfo;
}
