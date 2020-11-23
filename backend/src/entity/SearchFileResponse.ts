import {File} from './File'
import {SearchFile} from './SearchFile'

export class SearchFileResponse {

  uuid: string
  measurementDate: Date
  site: string
  siteId: string
  product: string
  productId: string
  size: number
  volatile: boolean

  constructor(file: SearchFile) {
    this.uuid = file.uuid
    this.measurementDate = file.measurementDate
    this.site = file.site.humanReadableName
    this.siteId = file.site.id
    this.product = file.product.humanReadableName
    this.productId = file.product.id
    this.size = file.size
    this.volatile = file.volatile
  }
}
