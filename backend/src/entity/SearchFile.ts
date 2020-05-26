import {File} from './File'

export class SearchFile {

  uuid: string
  measurementDate: Date
  site: string
  product: string
  productId: string
  size: number

  constructor(file: File) {
    this.uuid = file.uuid
    this.measurementDate = file.measurementDate
    this.site = file.site.humanReadableName
    this.product = file.product.humanReadableName
    this.productId = file.product.id
    this.size = file.size
  }
}
