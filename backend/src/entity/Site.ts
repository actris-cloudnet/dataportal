import {Column, Entity, OneToMany, PrimaryColumn} from 'typeorm'
import {File} from './File'
import {Upload} from './Upload'

@Entity()
export class Site {

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
    gaw!: string

    @Column()
    country!: string

    @Column({ default: false })
    isTestSite!: boolean

    @Column({ default: false })
    isModelOnlySite!: boolean

    @OneToMany(_ => File, file => file.site)
    files!: File[]

    @OneToMany(_ => Upload, upload => upload.site)
    uploads!: Upload[]
}
