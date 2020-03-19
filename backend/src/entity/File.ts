import {Entity, Column, PrimaryColumn, CreateDateColumn, ManyToOne} from 'typeorm'
import { NetCDFObject } from './NetCDFObject'
import { Site } from './Site'

export enum CloudnetFileType {
    CATEGORIZE = 'categorize',
    CLASSIFICATION = 'classification',
    DRIZZLE = 'drizzle',
    IWC = 'iwc',
    LIDAR = 'lidar',
    LWC = 'lwc',
    MODEL = 'model',
    MWR = 'mwr',
    RADAR = 'radar'
}

export enum FilePublicity {
    PUBLIC = 'public',
    NO_DL = 'nodl',
    HIDDEN = 'hidden'
}

export const level: {[key in CloudnetFileType]: number} = {
  'radar': 1,
  'lidar': 1,
  'mwr': 1,
  'model': 1,
  'categorize': 1,
  'classification': 2,
  'drizzle': 2,
  'iwc': 2,
  'lwc': 2
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

    @Column({
      type: 'enum',
      enum: CloudnetFileType
    })
    product!: CloudnetFileType

    @Column({nullable: true})
    cloudnetpyVersion!: string

    @CreateDateColumn()
    releasedAt!: Date

    @Column()
    filename!: string

    @Column()
    checksum!: string

    @Column()
    size!: number

    @Column()
    format!: string

    @Column()
    level!: number

    constructor(obj: NetCDFObject, filename: string, chksum: string, filesize: number, format: string, site: Site) {
      // A typeorm hack, see https://github.com/typeorm/typeorm/issues/3903
      if(typeof obj == 'undefined') return

      const cloudnetType = obj.cloudnet_file_type as CloudnetFileType

      this.measurementDate = new Date(
        parseInt(obj.year),
        parseInt(obj.month) - 1,
        parseInt(obj.day)
      )
      this.title = obj.title
      this.history = obj.history
      this.site = site
      this.product = cloudnetType
      if(typeof obj.cloudnetpy_version == 'string') {
        this.cloudnetpyVersion = obj.cloudnetpy_version
      }
      this.uuid = obj.file_uuid
      this.filename = filename
      this.checksum = chksum
      this.size = filesize
      this.format = format
      this.level = level[cloudnetType]
    }
}
