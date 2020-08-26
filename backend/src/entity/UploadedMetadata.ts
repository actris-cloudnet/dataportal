import {Column, Entity, ManyToOne, PrimaryColumn, Unique} from 'typeorm/index'
import {Site} from './Site'
import {Instrument} from './Instrument'

export enum Status {
  CREATED = 'created',
  UPLOADED = 'uploaded',
  PROCESSED = 'processed'
}

@Entity()
export class UploadedMetadata {

  @PrimaryColumn({type: 'varchar', length: 18, unique: true})
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

  @ManyToOne(_ => Site, site => site.uploadedMetadatas)
  site!: Site

  @ManyToOne(_ => Instrument, instrument => instrument.uploadedMetadatas)
  instrument!: Instrument

  constructor(id: string, hash: string, filename: string, date: string, site: Site, instrument: Instrument, status: Status) {
    this.id = id
    this.hash = hash
    this.filename = filename
    this.measurementDate= new Date(date)
    this.site = site
    this.instrument = instrument
    this.status = status
  }
}
