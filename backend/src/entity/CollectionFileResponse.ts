import {File, ModelFile, RegularFile} from './File'

export class CollectionFileResponse {

  uuid: string
  measurementDate: Date
  site: string
  siteId: string
  product: string
  productId: string
  modelId: string | null
  size: number
  volatile: boolean
  legacy: boolean

  constructor(file: RegularFile | ModelFile) {
    this.uuid = file.uuid
    this.measurementDate = file.measurementDate
    this.site = file.site.humanReadableName
    this.siteId = file.site.id
    this.product = file.product.humanReadableName
    this.productId = file.product.id
    this.modelId = 'model' in file ? file.model.id : null
    this.size = file.size
    this.volatile = file.volatile
    this.legacy = file.legacy
  }
}
