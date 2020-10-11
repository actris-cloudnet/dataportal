import {Column, Entity, ManyToOne, PrimaryColumn} from 'typeorm/index'
import {Site} from './Site'
import {Instrument} from './Instrument'
import {BeforeInsert, BeforeUpdate} from 'typeorm'

export enum Status {
  CREATED = 'created',
  UPLOADED = 'uploaded',
  PROCESSED = 'processed'
}

export const METADATA_ID_LENGTH = 18

@Entity()
export class UploadedMetadata {

  @PrimaryColumn({type: 'varchar', length: METADATA_ID_LENGTH, unique: true})
  id!: string

  @Column({type: 'varchar', length: 64, unique: true})
  hash!: string

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

  @BeforeInsert()
  setCreatedAt() {
    this.createdAt = new Date()
    this.updatedAt = this.createdAt
  }

  @BeforeUpdate()
  setUpdatedAt() {
    this.updatedAt = new Date()
  }

  constructor(id: string, hash: string, filename: string, date: string, site: Site, instrument: Instrument, status: Status) {
    this.id = id
    this.hash = hash
    this.filename = filename
    this.measurementDate = new Date(date)
    this.site = site
    this.instrument = instrument
    this.status = status
  }
}
