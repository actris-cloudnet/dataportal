/* eslint-disable no-unused-vars */
import {Entity, Column, PrimaryColumn, CreateDateColumn} from 'typeorm'

export enum CloudnetFileType {
    CATEGORIZE = 'categorize',
    CLASSIFICATION = 'classification',
    DRIZZLE = 'drizzle',
    IWC = 'iwc',
    LIDAR = 'lidar',
    LWC = 'lwc',
    MODEL = 'model',
    MWR = 'mwr',
    RADAR = 'radar'
}

export enum FilePublicity {
    PUBLIC = 'public',
    NO_DL = 'nodl',
    HIDDEN = 'hidden'
}

@Entity()
export class File {

    @PrimaryColumn('uuid')
    uuid!: string

    @Column()
    title!: string

    @Column()
    date!: Date

    @Column()
    location!: string

    @Column()
    history!: string

    @Column({
        type: 'enum',
        enum: FilePublicity,
        default: FilePublicity.PUBLIC
    })
    publicity!: FilePublicity

    @Column({
        type: 'enum',
        enum: CloudnetFileType
    })
    type!: CloudnetFileType

    @CreateDateColumn()
    createdAt!: Date

    @Column()
    path!: string

    @Column()
    checksum!: string

    @Column()
    size!: number
}