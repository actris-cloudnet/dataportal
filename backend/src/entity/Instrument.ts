import {Entity, Column, PrimaryColumn, OneToMany} from 'typeorm'
import {UploadedMetadata} from './UploadedMetadata'

export enum InstrumentType {
  RADAR = 'radar',
  LIDAR = 'lidar',
  MWR = 'mwr'
}

@Entity()
export class Instrument {

  @PrimaryColumn()
  id!: string

  @Column()
  type!: InstrumentType

  @OneToMany(_ => UploadedMetadata, uploadedMetadata => uploadedMetadata.site)
  uploadedMetadatas!: UploadedMetadata[]
}
