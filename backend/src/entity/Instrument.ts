import {Entity, Column, PrimaryColumn, OneToMany} from 'typeorm'
import {UploadedMetadata} from './UploadedMetadata'
import {ManyToOne} from 'typeorm/index'
import {Product} from './Product'

@Entity()
export class Instrument {

  @PrimaryColumn()
  id!: string

  @ManyToOne(_ => Product, product => product.instruments)
  product!: Product

  @OneToMany(_ => UploadedMetadata, uploadedMetadata => uploadedMetadata.site)
  uploadedMetadatas!: UploadedMetadata[]
}
