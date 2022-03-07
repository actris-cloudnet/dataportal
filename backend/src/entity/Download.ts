import {Column, Entity, PrimaryGeneratedColumn,} from 'typeorm'

export enum ObjectType {
  Product = 'product',
  Collection = 'collection',
  Raw = 'raw'
}

@Entity()
export class Download {

  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  objectType!: ObjectType

  @Column('uuid')
  objectUuid!: string

  @Column()
  ip!: string

  @Column({ type: 'char', length: 2, nullable: true })
  country!: string | null

  @Column()
  createdAt!: Date


  constructor(objectType: ObjectType, objectUuid: string, ip: string, country?: string, createdAt = new Date()) {
    this.objectType = objectType
    this.objectUuid = objectUuid
    this.ip = ip
    this.country = country || null
    this.createdAt = createdAt
  }
}
