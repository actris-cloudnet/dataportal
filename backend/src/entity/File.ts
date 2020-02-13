/* eslint-disable no-unused-vars */
import {Entity, Column, PrimaryColumn, CreateDateColumn} from 'typeorm'
import { NetCDFObject } from './NetCDFObject'

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

    constructor(obj: NetCDFObject, filename: string, chksum: string, filesize: number) {
        // A typeorm hack, see https://github.com/typeorm/typeorm/issues/3903
        if(typeof obj == 'undefined') return

        this.date = new Date(
            parseInt(obj.year),
            parseInt(obj.month),
            parseInt(obj.day)
        )
        this.title = obj.title
        this.location = obj.location
        this.history = obj.history
        this.type = obj.cloudnet_file_type as CloudnetFileType
        this.uuid = obj.file_uuid
        this.path = filename
        this.checksum = chksum
        this.size = filesize
    }
}