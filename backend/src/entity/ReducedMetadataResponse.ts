import { Instrument } from "./Instrument";
import { InstrumentUpload } from "./Upload";

export class ReducedMetadataResponse {
  instrument: Instrument;

  constructor(md: InstrumentUpload) {
    this.instrument = md.instrument;
  }
}
