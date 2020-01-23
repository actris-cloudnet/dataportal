import {Entity, Column, PrimaryColumn, CreateDateColumn} from "typeorm";

export enum CloudnetFileType {
    LIDAR = 'lidar',
    RADAR = 'radar',
    MODEL = 'model',
    MWR = 'mwr',
    CATEGORIZE = 'categorize',
    LWC = 'lwc',
    IWC = 'iwc',
    DRIZZLE = 'drizzle',
    CLASSIFICATION = 'classification'
}

export enum FilePublicity {
    PUBLIC = "public",
    NO_DL = "nodl",
    HIDDEN = "hidden"
}

@Entity()
export class File {

    @PrimaryColumn("uuid")
    uuid!: string;

    @Column()
    title!: string;

    @Column()
    date!: Date;

    @Column()
    location!: string;

    @Column()
    history!: string;

    @Column()
    filepath!: string

    @Column({
        type: "enum",
        enum: FilePublicity,
        default: FilePublicity.PUBLIC
    })
    publicity!: FilePublicity

    @Column({
        type: "enum",
        enum: CloudnetFileType
    })
    type!: CloudnetFileType



    @CreateDateColumn()
    createdAt!: Date;
}
