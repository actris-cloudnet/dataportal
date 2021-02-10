import {Entity, ManyToOne, PrimaryColumn} from 'typeorm'
import {File, RegularFile} from './File'
import {ProductVariable} from './ProductVariable'


@Entity()
export class Visualization {
  @PrimaryColumn()
  s3key!: string

  @ManyToOne(_ => RegularFile, file => file.visualizations)
  sourceFile!: File

  @ManyToOne(_ => ProductVariable, prodVar => prodVar.visualizations)
  productVariable!: ProductVariable

  constructor(filename: string, sourceFile: File, productVariable: ProductVariable) {
    this.s3key = filename
    this.sourceFile = sourceFile
    this.productVariable = productVariable
  }
}
