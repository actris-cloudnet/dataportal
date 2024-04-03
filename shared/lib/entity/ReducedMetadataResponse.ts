import type { Instrument, InstrumentInfo } from "./Instrument";

export interface ReducedMetadataResponse {
  instrument: Instrument;
  instrumentPid: string | null;
  instrumentInfo: InstrumentInfo | null;
}
