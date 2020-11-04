import {Instrument} from './Instrument'
import {Model} from './Model'
import {Upload} from './Upload'

export class ReducedMetadataResponse {
  instrument: Instrument | null
  model: Model | null

  constructor(md: Upload) {
    this.instrument = md.instrument
    this.model = md.model
  }
}
