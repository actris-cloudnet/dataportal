import {Column, Entity, ManyToOne, PrimaryColumn} from 'typeorm/index'
import {Site} from './Site'
import {Product} from './Product'

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

  @ManyToOne(_ => Product, product => product.uploadedMetadatas)
  product!: Product

  constructor(hash: string, filename: string, date: string, site: Site, product: Product) {
    this.hash = hash
    this.filename = filename
    this.measurementDate= new Date(date)
    this.site = site
    this.product = product
  }
}
