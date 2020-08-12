import {Column, Entity, PrimaryColumn} from 'typeorm/index'

@Entity()
export class UploadedMetadata {

  @PrimaryColumn()
  hash!: string

  @Column()
  filename!: string

  @Column({type: 'date'})
  measurementDate!: Date

  constructor(hash: string, filename: string, date: string) {
    this.hash = hash
    this.filename = filename
    this.measurementDate= new Date(date)
  }
}