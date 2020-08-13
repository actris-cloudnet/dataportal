import {Entity, Column, PrimaryColumn, OneToMany} from 'typeorm'
import {File} from './File'
import {UploadedMetadata} from './UploadedMetadata'

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

    @OneToMany(_ => File, file => file.site)
    files!: File[]

    @OneToMany(_ => UploadedMetadata, uploadedMetadata => uploadedMetadata.site)
    uploadedMetadatas!: File[]
}
