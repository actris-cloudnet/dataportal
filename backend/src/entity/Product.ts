import { Entity, PrimaryColumn, Column, OneToMany } from 'typeorm'
import { File } from './File'
import {ProductVariable} from './ProductVariable'
import {UploadedMetadata} from './UploadedMetadata'

@Entity()
export class Product {

    @PrimaryColumn()
    id!: string

    @Column()
    humanReadableName!: string

    @Column()
    level!: string

    @OneToMany(_ => File, file => file.site)
    files!: File[]

    @OneToMany(_ => ProductVariable, prodVar => prodVar.product)
    variables!: ProductVariable[]

    @OneToMany(_ => UploadedMetadata, uploadedMetadata => uploadedMetadata.site)
    uploadedMetadatas!: UploadedMetadata[]
}
