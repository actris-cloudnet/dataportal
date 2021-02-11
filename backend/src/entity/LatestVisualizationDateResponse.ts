import {File, ModelFile} from './File'

export class LatestVisualizationDateResponse {
  date: Date

  constructor(file: File|ModelFile) {
    this.date = file.measurementDate
  }
}
