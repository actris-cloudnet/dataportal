import {Column, Entity, JoinTable, ManyToMany, OneToMany, PrimaryColumn} from 'typeorm'
import {ModelUpload} from './Upload'
import {ModelFile} from './File'
import {Citation, ModelCitation} from './Citation'

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

    @ManyToMany(_ => ModelCitation)
    @JoinTable()
    citations!: ModelCitation[]
}
