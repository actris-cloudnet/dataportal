import {Column, Entity, ManyToOne, PrimaryColumn} from 'typeorm/index'
import {Site} from './Site'
import {Product} from './Product'

export enum Status {
  CREATED = 'created',
  UPLOADED = 'uploaded'
}

@Entity()
export class UploadedMetadata {

  @PrimaryColumn()
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

  @ManyToOne(_ => Product, product => product.uploadedMetadatas)
  product!: Product

  constructor(hash: string, filename: string, date: string, site: Site, product: Product, status: Status) {
    this.hash = hash
    this.filename = filename
    this.measurementDate= new Date(date)
    this.site = site
    this.product = product
    this.status = status
  }
}
