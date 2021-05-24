import {Visualization} from './Visualization'
import {ModelFile, RegularFile} from './File'

export class VisualizationResponse {

  sourceFileId: string
  locationHumanReadable: string
  productHumanReadable: string
  volatile: boolean
  legacy: boolean
  visualizations: Visualization[]

  constructor(file: RegularFile|ModelFile) {
    this.sourceFileId = file.uuid
    this.visualizations = file.visualizations
      .sort((a, b) => parseInt(a.productVariable.order) - parseInt(b.productVariable.order))
    this.productHumanReadable = file.product.humanReadableName
    this.locationHumanReadable = file.site.humanReadableName
    this.volatile = file.volatile
    this.legacy = file.legacy
  }
}
