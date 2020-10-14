import {Entity, Column, PrimaryColumn, ManyToOne, BeforeUpdate, BeforeInsert, Unique, Index} from 'typeorm'
import {ModelSite} from './ModelSite'
import {ModelType} from './ModelType'

@Entity()
@Unique(['checksum'])
@Index(['measurementDate', 'site'])
export class ModelFile {

    @PrimaryColumn('uuid')
    uuid!: string

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
      uuid: string,
      measurementDate: Date,
      filename: string,
      checksum: string,
      format: string,
      size: number,
      site: ModelSite,
      modelType: ModelType,
      volatile = true,
    ) {
      this.measurementDate = measurementDate
      this.uuid = uuid
      this.filename = filename
      this.checksum = checksum
      this.format = format
      this.size = size
      this.site = site
      this.modelType = modelType
      this.volatile = volatile
    }
}
