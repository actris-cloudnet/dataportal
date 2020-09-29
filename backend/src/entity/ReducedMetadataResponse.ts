import {Instrument} from './Instrument'
import {UploadedMetadata} from './UploadedMetadata'

export class ReducedMetadataResponse {
  instrument: Instrument

  constructor(md: UploadedMetadata) {
    this.instrument = md.instrument
  }
}
