import {Entity, Column, PrimaryColumn, OneToMany} from 'typeorm'
import {Upload} from './Upload'

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

  @OneToMany(_ => Upload, uploadedMetadata => uploadedMetadata.site)
  uploadedMetadatas!: Upload[]
}
