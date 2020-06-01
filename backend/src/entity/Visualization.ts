import {Entity, PrimaryColumn, ManyToOne} from 'typeorm'
import { File } from './File'
import {ProductVariable} from './ProductVariable'


@Entity()
export class Visualization {
  @PrimaryColumn()
  filename!: string

  @ManyToOne(_ => File, file => file.visualizations)
  sourceFile!: File

  @ManyToOne(_ => ProductVariable, prodVar => prodVar.visualizations)
  productVariable!: ProductVariable

  constructor(filename: string, sourceFile: File, productVariable: ProductVariable) {
    this.filename = filename
    this.sourceFile = sourceFile
    this.productVariable = productVariable
  }
}
