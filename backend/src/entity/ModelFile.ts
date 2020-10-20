import {Entity, Column, PrimaryGeneratedColumn, ManyToOne, BeforeUpdate, BeforeInsert, Unique, Index} from 'typeorm'
import {Site} from './Site'
import {ModelType} from './ModelType'

@Entity()
@Unique(['checksum'])
@Index(['measurementDate', 'site'])
export class ModelFile {

    @PrimaryGeneratedColumn()
    id!: number

    @Column()
    filename!: string

    @Column({default: true})
    volatile!: boolean

    @Column({type: 'date'})
    measurementDate!: Date

    @ManyToOne(() => Site, site => site.files)
    site!: Site

    @ManyToOne(() => ModelType, type => type.files)
    modelType!: ModelType

    @Column()
    releasedAt!: Date

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
      measurementDate: Date,
      filename: string,
      checksum: string,
      format: string,
      size: number,
      site: Site,
      modelType: ModelType,
      volatile = true,
    ) {
      this.measurementDate = measurementDate
      this.filename = filename
      this.checksum = checksum
      this.format = format
      this.size = size
      this.site = site
      this.modelType = modelType
      this.volatile = volatile
    }
}
