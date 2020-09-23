import {Visualization} from './Visualization'
import {File} from './File'

export class VisualizationResponse {

  sourceFileId: string
  locationHumanReadable: string
  productHumanReadable: string
  visualizations: Visualization[]

  constructor(file: File) {
    this.sourceFileId = file.uuid
    this.visualizations = file.visualizations
      .sort((a, b) => parseInt(a.productVariable.order) - parseInt(b.productVariable.order))
    this.productHumanReadable = file.product.humanReadableName
    this.locationHumanReadable = file.site.humanReadableName
  }
}
