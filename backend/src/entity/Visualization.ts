import {Entity, Column, PrimaryColumn, ManyToOne} from 'typeorm'
import { File } from './File'


@Entity()
export class Visualization {

  @PrimaryColumn()
  filename!: string

  @Column()
  variableId!: string

  @Column()
  variableHumanReadableName!: string

  @ManyToOne(_ => File, file => file.visualizations)
  sourceFile!: File

  constructor(filename: string, variableId: string, variableHumanReadableName: string, sourceFile: File) {
    this.filename = filename
    this.variableId = variableId
    this.variableHumanReadableName = variableHumanReadableName
    this.sourceFile = sourceFile
  }
}

