import {Entity, Column, PrimaryColumn, OneToMany, ManyToOne} from 'typeorm'
import {Visualization} from './Visualization'
import {Product} from './Product'


@Entity()
export class ProductVariable {

  @PrimaryColumn()
  id!: string

  @Column()
  humanReadableName!: string

  @Column()
  order!: string

  @OneToMany(_ => Visualization, viz => viz.productVariable)
  visualizations!: Visualization[]

  @ManyToOne(_ => Product, prod => prod.variables)
  product!: Product

  constructor(id: string, humanReadableName: string, order: string, visualizations: Visualization[], product: Product) {
    this.id = id
    this.humanReadableName = humanReadableName
    this.order = order
    this.visualizations = visualizations
    this.product = product
  }
}
