import {Entity, Column, PrimaryColumn, OneToMany} from 'typeorm'
import {Visualization} from './Visualization'


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

  constructor(id: string, humanReadableName: string, order: string, visualizations: Visualization[]) {
    this.id = id
    this.humanReadableName = humanReadableName
    this.order = order
    this.visualizations = visualizations
  }
}
