import {Collection} from './Collection'
import {SearchFileResponse} from './SearchFileResponse'
import {convertToSearchFiles} from '../lib'

export class CollectionResponse {

  uuid: string
  files: SearchFileResponse[]
  title: string
  pid: string
  downloadCount: number
  createdAt: Date
  updatedAt: Date

  constructor(coll: Collection) {
    this.uuid = coll.uuid
    this.files = convertToSearchFiles(coll.files)
    this.title = coll.title
    this.pid = coll.pid
    this.downloadCount = coll.downloadCount
    this.createdAt = coll.createdAt
    this.updatedAt = coll.updatedAt
  }
}
