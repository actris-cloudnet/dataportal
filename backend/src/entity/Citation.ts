import {Column, Entity, ManyToMany, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn} from 'typeorm'
import {Site} from './Site'
import {Model} from './Model'


@Entity()
export class Citation {

  @PrimaryColumn()
  id!: string

  @Column({type: 'text'})
  acknowledgements!: string

}

@Entity()
export class RegularCitation extends Citation {

  @ManyToMany(_ => Site)
  sites!: Site[]
}

@Entity()
export class ModelCitation extends Citation {

  @ManyToMany(_ => Model)
  models!: Model[]
}
