import {Entity, Column, PrimaryColumn, ManyToOne, BeforeUpdate, BeforeInsert, OneToMany, Unique, Index} from 'typeorm'
import { NetCDFObject } from './NetCDFObject'
import { Site } from './Site'
import { Product } from './Product'
import {Visualization} from './Visualization'
import {dateToJSDate} from '../lib'

export enum FilePublicity {
    PUBLIC = 'public',
    NO_DL = 'nodl',
    HIDDEN = 'hidden'
}

@Entity()
@Unique(['checksum'])
@Index(['measurementDate', 'site', 'product'])
export class File {

    @PrimaryColumn('uuid')
    uuid!: string

    @Column({default: ''})
    pid!: string

    @Column({default: true})
    volatile!: boolean

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

    @Column({default: ''})
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

    @Column('text', {array: true, nullable: true})
    sourceFileIds!: string[]

    @OneToMany(_ => Visualization, viz => viz.sourceFile)
    visualizations!: Visualization[]

    @Column()
    s3key!: string

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
      product: Product,
      volatile = true,
      sourceFiles: File[] = [],
      s3key: string
    ) {
      // A typeorm hack, see https://github.com/typeorm/typeorm/issues/3903
      if (typeof obj == 'undefined') return

      this.measurementDate = dateToJSDate(obj.year, obj.month, obj.day)
      this.title = obj.title
      this.history = obj.history
      this.site = site
      this.product = product
      if (typeof obj.cloudnetpy_version == 'string') this.cloudnetpyVersion = obj.cloudnetpy_version
      if (typeof obj.pid == 'string') this.pid = obj.pid
      this.uuid = obj.file_uuid
      this.filename = filename
      this.checksum = chksum
      this.size = filesize
      this.format = format
      this.volatile = volatile
      this.sourceFileIds = sourceFiles.map(file => file.uuid)
      this.s3key = s3key
    }
}
