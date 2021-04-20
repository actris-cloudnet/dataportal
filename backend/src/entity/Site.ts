import {Column, Entity, JoinTable, ManyToMany, OneToMany, PrimaryColumn} from 'typeorm'
import {File} from './File'
import {Upload} from './Upload'
import {Calibration} from './Calibration'
import {Citation, RegularCitation} from './Citation'

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

    @Column()
    country!: string

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
