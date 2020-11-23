import {Entity, Column, PrimaryColumn, ManyToOne} from 'typeorm'
import { Site } from './Site'
import { Product } from './Product'
import {File} from './File'

@Entity()
export class SearchFile {

  @PrimaryColumn('uuid')
  uuid!: string

  @Column({type: 'date'})
  measurementDate!: Date

  @ManyToOne(_ => Site, site => site.files)
  site!: Site

  @ManyToOne(_ => Product, product => product.files)
  product!: Product

  @Column()
  size!: number

  @Column({default: true})
  volatile!: boolean

  constructor(file: File) {
    // A typeorm hack, see https://github.com/typeorm/typeorm/issues/3903
    if (typeof file == 'undefined') return

    this.uuid = file.uuid
    this.measurementDate = file.measurementDate
    this.site = file.site
    this.product = file.product
    this.size = file.size
    this.volatile = file.volatile
  }
}


