import {Column, Entity, OneToMany, PrimaryColumn} from 'typeorm'
import {Upload} from './Upload'
import {ModelFile} from './File'

@Entity()
export class Model {

    @PrimaryColumn()
    id!: string

    @Column()
    optimumOrder!: number;

    @OneToMany(_ => Upload, uploads => uploads.site)
    uploads!: Upload[]

    @OneToMany(_ => ModelFile, modelfile => modelfile.model)
    files!: ModelFile[]
}
