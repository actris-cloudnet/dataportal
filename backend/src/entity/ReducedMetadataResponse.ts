import { InstrumentInfo } from "./Instrument";
import { InstrumentUpload } from "./Upload";

export class ReducedMetadataResponse {
  instrumentInfo: InstrumentInfo | null;

  constructor(md: InstrumentUpload) {
    this.instrumentInfo = md.instrumentInfo;
  }
}
