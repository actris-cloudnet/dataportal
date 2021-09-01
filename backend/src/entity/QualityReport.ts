import {Column, Entity, PrimaryColumn} from 'typeorm'


@Entity()
export class QualityReport {

  @PrimaryColumn('uuid')
  fileUuid!: string

  @Column('jsonb')
  report!: any
}


