import {Instrument} from './Instrument'
import {Upload} from './Upload'

export class ReducedMetadataResponse {
  instrument: Instrument

  constructor(md: Upload) {
    this.instrument = md.instrument
  }
}
