import {Column, Entity, JoinTable, ManyToMany, OneToMany, PrimaryColumn} from 'typeorm'
import {File} from './File'
import {Upload} from './Upload'
import {Calibration} from './Calibration'
import {RegularCitation} from './Citation'

export enum SiteType {
    CLOUDNET = 'cloudnet',
    ARM = 'arm',
    CAMPAIGN = 'campaign',
    MOBILE = 'mobile',
    TEST = 'test',
    HIDDEN = 'hidden'
}

@Entity()
export class Site {

    @PrimaryColumn()
    id!: string

    @Column()
    humanReadableName!: string

    @Column('text', {array: true, nullable: true})
    type!: SiteType[]

    @Column({type: 'float'})
    latitude!: number

    @Column({type: 'float'})
    longitude!: number

    @Column()
    altitude!: number

    @Column()
    gaw!: string

    @Column({nullable: true})
    dvasId!: string

    @Column()
    country!: string

    @Column({type: 'char', length: 2, nullable: true})
    iso_3166_1_alpha_2!: string|null

    @Column({type: 'varchar', length: 6, nullable: true})
    iso_3166_2!: string|null

    @OneToMany(_ => File, file => file.site)
    files!: File[]

    @OneToMany(_ => Upload, upload => upload.site)
    uploads!: Upload[]

    @OneToMany(_ => Calibration, calib => calib.site)
    calibrations!: Calibration[]

    @ManyToMany(_ => RegularCitation)
    @JoinTable()
    citations!: RegularCitation[]

    get isTestSite() {
      return this.type.includes(SiteType.TEST)
    }

    get isHiddenSite() {
      return this.type.includes(SiteType.HIDDEN)
    }
}
