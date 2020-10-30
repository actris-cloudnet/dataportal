import {Column, Entity, ManyToOne, PrimaryColumn} from 'typeorm/index'
import {Site} from './Site'
import {Instrument} from './Instrument'
import {BeforeInsert, BeforeUpdate} from 'typeorm'
import { v4 as generateUuidV4 } from 'uuid'

export enum Status {
  CREATED = 'created',
  UPLOADED = 'uploaded',
  PROCESSED = 'processed'
}

@Entity()
export class Upload {

  @PrimaryColumn('uuid')
  uuid!: string

  @Column({type: 'varchar', length: 32, unique: true})
  hashSum!: string

  @Column()
  filename!: string

  @Column({type: 'date'})
  measurementDate!: Date

  @Column({
    type: 'enum',
    enum: Status,
    default: Status.CREATED
  })
  status!: Status

  @Column()
  createdAt!: Date

  @Column()
  updatedAt!: Date

  @ManyToOne(_ => Site, site => site.uploadedMetadatas)
  site!: Site

  @ManyToOne(_ => Instrument, instrument => instrument.uploadedMetadatas)
  instrument!: Instrument

  get s3key() {
    return `${this.site.id}/${this.hashSum}/${this.filename}`
  }

  @BeforeInsert()
  setCreatedAt() {
    this.createdAt = new Date()
    this.updatedAt = this.createdAt
  }

  @BeforeUpdate()
  setUpdatedAt() {
    this.updatedAt = new Date()
  }

  constructor(hash: string, filename: string, date: string, site: Site, instrument: Instrument, status: Status) {
    this.uuid = generateUuidV4()
    this.hashSum = hash
    this.filename = filename
    this.measurementDate = new Date(date)
    this.site = site
    this.instrument = instrument
    this.status = status
  }
}
