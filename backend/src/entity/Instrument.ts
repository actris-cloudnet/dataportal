import {Column, Entity, OneToMany, PrimaryColumn} from 'typeorm'
import {InstrumentUpload} from './Upload'

export enum InstrumentType {
  RADAR = 'radar',
  LIDAR = 'lidar',
  MWR = 'mwr',
  DISDROMETER = 'disdrometer'
}

@Entity()
export class Instrument {

  @PrimaryColumn()
  id!: string

  @Column()
  type!: InstrumentType

  @Column()
  humanReadableName!: string

  @OneToMany(_ => InstrumentUpload, upload => upload.site)
  uploads!: InstrumentUpload[]
}
