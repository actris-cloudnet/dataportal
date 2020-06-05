import {File} from './File'

export class LatestVisualizationDateResponse {
  date: Date

  constructor(file: File) {
    this.date = file.measurementDate
  }
}
