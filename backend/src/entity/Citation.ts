import {Column, Entity, ManyToOne, PrimaryGeneratedColumn} from 'typeorm'
import {Site} from './Site'


@Entity()
export class Citation {

  @PrimaryGeneratedColumn()
  id!: number

  @ManyToOne(_ => Site, site => site.citations)
  site!: Site

  @Column({type: 'text'})
  acknowledgements!: string


  constructor(site: Site, acknowledgements: string) {
    this.site = site
    this.acknowledgements = acknowledgements
  }
}
