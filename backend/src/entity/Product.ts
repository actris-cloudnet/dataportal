import {Column, Entity, OneToMany, PrimaryColumn} from 'typeorm'
import {File} from './File'
import {ProductVariable} from './ProductVariable'
import {Upload} from './Upload'

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

    @OneToMany(_ => Upload, uploadedMetadata => uploadedMetadata.site)
    uploadedMetadatas!: Upload[]
}
