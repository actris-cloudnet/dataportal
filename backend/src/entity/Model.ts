import {Column, Entity, OneToMany, PrimaryColumn} from 'typeorm'
import {ModelUpload} from './Upload'
import {ModelFile} from './File'

@Entity()
export class Model {

    @PrimaryColumn()
    id!: string

    @Column()
    optimumOrder!: number;

    @OneToMany(_ => ModelUpload, uploads => uploads.site)
    uploads!: ModelUpload[]

    @OneToMany(_ => ModelFile, modelfile => modelfile.model)
    files!: ModelFile[]
}
