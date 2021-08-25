import {Column, Entity, OneToOne, PrimaryColumn, PrimaryGeneratedColumn} from 'typeorm'
import {File} from './File'


@Entity()
export class QualityReport {

  @PrimaryColumn('uuid')
  fileUuid!: string

  @Column('jsonb')
  report!: any
}


