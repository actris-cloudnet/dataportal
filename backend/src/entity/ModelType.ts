import {Entity, PrimaryColumn, Column, OneToMany} from 'typeorm'
import {ModelFile} from './ModelFile'

@Entity()
export class ModelType {

    @PrimaryColumn()
    id!: string

    @Column()
    optimumOrder!: number;

    @OneToMany(() => ModelFile, file => file.site)
    files!: ModelFile[]

}
