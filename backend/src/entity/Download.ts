import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm'

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

  @Column()
  createdAt!: Date


  constructor(objectType: ObjectType, objectUuid: string, ip: string) {
    this.objectType = objectType
    this.objectUuid = objectUuid
    this.ip = ip
    this.createdAt = new Date()
  }
}
