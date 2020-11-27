import {BeforeInsert, BeforeUpdate, Column, Entity, Index, ManyToOne, OneToMany, PrimaryColumn, Unique} from 'typeorm'
import {Site} from './Site'
import {Product} from './Product'
import {Visualization} from './Visualization'
import {isValidDate} from '../lib'
import {basename} from 'path'

@Entity()
@Unique(['checksum'])
@Index(['measurementDate', 'site', 'product'])
export class File {

    @PrimaryColumn('uuid')
    uuid!: string

    @Column()
    s3key!: string

    @Column()
    version!: string

    @Column({default: ''})
    pid!: string

    @Column({default: true})
    volatile!: boolean

    @Column({type: 'date'})
    measurementDate!: Date

    @ManyToOne(_ => Site, site => site.files)
    site!: Site

    @Column({default: ''})
    history!: string

    @ManyToOne(_ => Product, product => product.files)
    product!: Product

    @Column({default: ''})
    cloudnetpyVersion!: string

    @Column()
    checksum!: string

    @Column()
    size!: number

    @Column()
    format!: string

    @Column('text', {array: true, nullable: true})
    sourceFileIds!: string[] | null

    @OneToMany(_ => Visualization, viz => viz.sourceFile)
    visualizations!: Visualization[]

    @Column()
    createdAt!: Date

    @Column()
    updatedAt!: Date

    get filename() {
      return basename(this.s3key)
    }

    @BeforeInsert()
    updateDateCreation() {
      this.createdAt = new Date()
      this.updatedAt = this.createdAt
    }

    @BeforeUpdate()
    updateDateUpdate() {
      this.updatedAt = new Date()
    }
}

export function isFile(obj: any): obj is File {
  return 'uuid' in obj
      && 'measurementDate' in obj
      && isValidDate(obj.measurementDate)
      && 'site' in obj
      && 'product' in obj
      && 'checksum' in obj
      && 'size' in obj
      && typeof obj.size == 'number'
      && 'format' in obj
      && 's3key' in obj
      && 'version' in obj
      && 'createdAt' in obj
      && isValidDate(obj.createdAt)
      && 'updatedAt' in obj
      && isValidDate(obj.updatedAt)
      && 'visualizations' in obj
      && (obj.volatile === true || (obj.volatile === false && 'pid' in obj))
}

