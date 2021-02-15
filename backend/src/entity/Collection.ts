import {BeforeInsert, BeforeUpdate, Column, Entity, JoinTable, ManyToMany, PrimaryColumn,} from 'typeorm'
import {ModelFile, RegularFile} from './File'
import {v4 as generateUuidV4} from 'uuid'

@Entity()
export class Collection {

  @PrimaryColumn('uuid')
  uuid!: string

  @ManyToMany(_type => RegularFile)
  @JoinTable()
  regularFiles!: RegularFile[]

  @ManyToMany(_type => ModelFile)
  @JoinTable()
  modelFiles!: ModelFile[]

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

  constructor(files: RegularFile[], modelFiles: ModelFile[]) {
    this.uuid = generateUuidV4()
    this.regularFiles = files
    this.modelFiles = modelFiles
  }
}
