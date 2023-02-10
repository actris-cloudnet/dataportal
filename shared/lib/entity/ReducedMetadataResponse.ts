import type { Instrument } from "./Instrument";

export interface ReducedMetadataResponse {
  instrument: Instrument;
  instrumentPid: string | null;
}
