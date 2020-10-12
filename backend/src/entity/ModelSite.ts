import {Entity, Column, PrimaryColumn, OneToMany} from 'typeorm'
import {ModelFile} from './ModelFile'

@Entity()
export class ModelSite {

    @PrimaryColumn()
    id!: string

    @Column()
    humanReadableName!: string

    @Column({type: 'float'})
    latitude!: number

    @Column({type: 'float'})
    longitude!: number

    @Column()
    altitude!: number

    @Column()
    country!: string

    @OneToMany(() => ModelFile, file => file.site)
    files!: ModelFile[]

}
