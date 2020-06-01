import {Visualization} from './Visualization'
import {File} from './File'

export class VisualizationResponse {

  sourceFileId: string
  locationHumanReadable: string
  productHumanReadable: string
  visualizations: Visualization[]

  constructor(file: File) {
    console.log(file)
    this.sourceFileId = file.uuid
    this.visualizations = file.visualizations
    this.productHumanReadable = file.product.humanReadableName
    this.locationHumanReadable = file.site.humanReadableName
  }
}