import {Column, Entity, OneToMany, PrimaryColumn} from 'typeorm'
import {Upload} from './Upload'
import {File} from './File'

@Entity()
export class Model {

    @PrimaryColumn()
    id!: string

    @Column()
    optimumOrder!: number;

    @OneToMany(_ => Upload, uploads => uploads.site)
    uploads!: Upload[]

    @OneToMany(_ => File, file => file.model)
    files!: File[]
}
