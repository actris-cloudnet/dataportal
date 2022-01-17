import {Column, Entity, ManyToOne, PrimaryColumn} from 'typeorm'
import {ModelFile} from './File'
import {ProductVariable} from './ProductVariable'
import {Dimensions} from './Visualization'


@Entity()
export class ModelVisualization {
  @PrimaryColumn()
  s3key!: string

  @ManyToOne(_ => ModelFile, file => file.visualizations)
  sourceFile!: ModelFile

  @ManyToOne(_ => ProductVariable, prodVar => prodVar.visualizations)
  productVariable!: ProductVariable

  @Column({ type: 'smallint', nullable: true })
  width: number | null

  @Column({ type: 'smallint', nullable: true })
  height: number | null

  @Column({ type: 'smallint', nullable: true })
  marginTop: number | null

  @Column({ type: 'smallint', nullable: true })
  marginRight: number | null

  @Column({ type: 'smallint', nullable: true })
  marginBottom: number | null

  @Column({ type: 'smallint', nullable: true })
  marginLeft: number | null

  constructor(filename: string, sourceFile: ModelFile, productVariable: ProductVariable, dimensions?: Dimensions) {
    this.s3key = filename
    this.sourceFile = sourceFile
    this.productVariable = productVariable
    this.width = dimensions ? dimensions.width : null
    this.height = dimensions ? dimensions.height : null
    this.marginTop = dimensions ? dimensions.marginTop : null
    this.marginRight = dimensions ? dimensions.marginRight : null
    this.marginBottom = dimensions ? dimensions.marginBottom : null
    this.marginLeft = dimensions ? dimensions.marginLeft : null
  }
}
