import { Instrument } from "./Instrument";
import { InstrumentUpload } from "./Upload";

export class ReducedMetadataResponse {
  instrument: Instrument;
  instrumentPid: string | null;

  constructor(md: InstrumentUpload) {
    this.instrument = md.instrument;
    this.instrumentPid = md.instrumentPid;
  }
}
