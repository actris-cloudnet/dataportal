import {Instrument} from './Instrument'
import {Model} from './Model'
import {Upload} from './Upload'

export class ReducedMetadataResponse {
  instrument?: Instrument
  model?: Model

  constructor(md: Upload) {
    if (md.instrument) this.instrument = md.instrument
    if (md.model) this.model = md.model
  }
}
