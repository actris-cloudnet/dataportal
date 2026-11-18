import type { InstrumentInfo, InstrumentStatus } from "./Instrument";

export interface ReducedMetadataResponse {
  instrument: InstrumentInfo;
  measurementDate: string;
  status: InstrumentStatus;
}
