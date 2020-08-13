import {Column, Entity, ManyToOne, PrimaryColumn} from 'typeorm/index'
import {Site} from './Site'

@Entity()
export class UploadedMetadata {

  @PrimaryColumn()
  hash!: string

  @Column()
  filename!: string

  @Column({type: 'date'})
  measurementDate!: Date

  @ManyToOne(_ => Site, site => site.uploadedMetadatas)
  site!: Site

  constructor(hash: string, filename: string, date: string, site: Site) {
    this.hash = hash
    this.filename = filename
    this.measurementDate= new Date(date)
    this.site = site
  }
}
