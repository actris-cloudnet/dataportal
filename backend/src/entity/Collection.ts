import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryColumn,
} from 'typeorm'
import {File} from './File'
import { v4 as generateUuidV4 } from 'uuid'

@Entity()
export class Collection {

  @PrimaryColumn('uuid')
  uuid!: string

  @ManyToMany(_type => File)
  @JoinTable()
  files!: File[]

  @Column({default: ''})
  title!: string

  @Column({default: ''})
  pid!: string

  @Column({default: 0})
  downloadCount!: number

  @Column()
  createdAt!: Date

  @Column()
  updatedAt!: Date

  @BeforeInsert()
  setCreatedAt() {
    this.createdAt = new Date()
    this.updatedAt = this.createdAt
  }

  @BeforeUpdate()
  setUpdatedAt() {
    this.updatedAt = new Date()
  }

  constructor(files: File[]) {
    this.uuid = generateUuidV4()
    this.files = files
  }
}
