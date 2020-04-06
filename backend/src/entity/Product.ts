import { Entity, PrimaryColumn, Column, OneToMany } from 'typeorm'
import { File } from './File'

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
}
