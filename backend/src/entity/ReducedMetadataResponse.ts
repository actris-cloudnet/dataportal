import { Instrument, InstrumentInfo } from "./Instrument";
import { InstrumentUpload } from "./Upload";

export class ReducedMetadataResponse {
  instrument: Instrument;
  instrumentPid: string | null;
  instrumentInfo: InstrumentInfo | null;

  constructor(md: InstrumentUpload) {
    this.instrument = md.instrument;
    this.instrumentPid = md.instrumentPid;
    this.instrumentInfo = md.instrumentInfo;
  }
}
