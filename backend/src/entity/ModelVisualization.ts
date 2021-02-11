import {Entity, ManyToOne, PrimaryColumn} from 'typeorm'
import {ModelFile} from './File'
import {ProductVariable} from './ProductVariable'


@Entity()
export class ModelVisualization {
  @PrimaryColumn()
  s3key!: string

  @ManyToOne(_ => ModelFile, file => file.visualizations)
  sourceFile!: ModelFile

  @ManyToOne(_ => ProductVariable, prodVar => prodVar.visualizations)
  productVariable!: ProductVariable

  constructor(filename: string, sourceFile: ModelFile, productVariable: ProductVariable) {
    this.s3key = filename
    this.sourceFile = sourceFile
    this.productVariable = productVariable
  }
}
