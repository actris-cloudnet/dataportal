import {Entity, Column, PrimaryColumn, ManyToOne, BeforeUpdate, BeforeInsert, Unique, Index} from 'typeorm'
import {NetCDFObject} from './NetCDFObject'
import {ModelSite} from './ModelSite'
import {ModelType} from './ModelType'

@Entity()
@Unique(['checksum'])
@Index(['measurementDate', 'site'])
export class ModelFile {

    @PrimaryColumn('uuid')
    uuid!: string

    @Column({default: ''})
    pid!: string

    @Column({default: true})
    volatile!: boolean

    @Column({type: 'date'})
    measurementDate!: Date

    @ManyToOne(() => ModelSite, site => site.files)
    site!: ModelSite

    @ManyToOne(() => ModelType, type => type.files)
    modelType!: ModelType

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
      site: ModelSite,
      volatile = true,
    ) {
      // A typeorm hack, see https://github.com/typeorm/typeorm/issues/3903
      if (typeof obj == 'undefined') return

      this.measurementDate = new Date(
        parseInt(obj.year),
        parseInt(obj.month) - 1,
        parseInt(obj.day)
      )
      this.site = site
      if (typeof obj.pid == 'string') this.pid = obj.pid
      this.uuid = obj.file_uuid
      this.filename = filename
      this.checksum = chksum
      this.size = filesize
      this.format = format
      this.volatile = volatile
    }
}
