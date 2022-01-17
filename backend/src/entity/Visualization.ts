import {Column, Entity, ManyToOne, PrimaryColumn} from 'typeorm'
import {File, RegularFile} from './File'
import {ProductVariable} from './ProductVariable'


export interface Dimensions {
  width: number
  height: number
  marginTop: number
  marginRight: number
  marginBottom: number
  marginLeft: number
}

@Entity()
export class Visualization {
  @PrimaryColumn()
  s3key!: string

  @ManyToOne(_ => RegularFile, file => file.visualizations)
  sourceFile!: File

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

  constructor(filename: string, sourceFile: File, productVariable: ProductVariable, dimensions?: Dimensions) {
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
