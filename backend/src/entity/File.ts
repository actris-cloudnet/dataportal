import {Entity, Column, PrimaryColumn, ManyToOne, BeforeUpdate, BeforeInsert} from 'typeorm'
import { NetCDFObject } from './NetCDFObject'
import { Site } from './Site'
import { Product } from './Product'

export enum FilePublicity {
    PUBLIC = 'public',
    NO_DL = 'nodl',
    HIDDEN = 'hidden'
}

@Entity()
export class File {

    @PrimaryColumn('uuid')
    uuid!: string

    @Column()
    title!: string

    @Column({type: 'date'})
    measurementDate!: Date

    @ManyToOne(_ => Site, site => site.files)
    site!: Site

    @Column()
    history!: string

    @Column({
      type: 'enum',
      enum: FilePublicity,
      default: FilePublicity.PUBLIC
    })
    publicity!: FilePublicity

    @ManyToOne(_ => Product, product => product.files)
    product!: Product

    @Column({nullable: true})
    cloudnetpyVersion!: string

    @Column()
    releasedAt!: Date

    @Column()
    filename!: string

    @Column()
    checksum!: string

    @Column()
    size!: number

    @Column()
    format!: string

    @BeforeInsert()
    updateDateCreation() {
      this.releasedAt = new Date()
    }

    @BeforeUpdate()
    updateDateUpdate() {
      this.releasedAt = new Date()
    }

    constructor(
      obj: NetCDFObject,
      filename: string,
      chksum: string,
      filesize: number,
      format: string,
      site: Site,
      product: Product
    ) {
      // A typeorm hack, see https://github.com/typeorm/typeorm/issues/3903
      if (typeof obj == 'undefined') return

      this.measurementDate = new Date(
        parseInt(obj.year),
        parseInt(obj.month) - 1,
        parseInt(obj.day)
      )
      this.title = obj.title
      this.history = obj.history
      this.site = site
      this.product = product
      if (typeof obj.cloudnetpy_version == 'string') {
        this.cloudnetpyVersion = obj.cloudnetpy_version
      }
      this.uuid = obj.file_uuid
      this.filename = filename
      this.checksum = chksum
      this.size = filesize
      this.format = format
    }
}
