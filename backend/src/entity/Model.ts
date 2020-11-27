import {Column, Entity, OneToMany, PrimaryColumn} from 'typeorm'
import {Upload} from './Upload'

@Entity()
export class Model {

    @PrimaryColumn()
    id!: string

    @Column()
    optimumOrder!: number;

    @OneToMany(_ => Upload, uploadedMetadata => uploadedMetadata.site)
    uploadedMetadatas!: Upload[]

}
