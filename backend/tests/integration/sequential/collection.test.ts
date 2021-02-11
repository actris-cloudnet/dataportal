import axios from 'axios'
import {backendPublicUrl, genResponse} from '../../lib'
import {Connection, createConnection, Repository} from 'typeorm'
import {Collection} from '../../../src/entity/Collection'
import {promises as fsp} from 'fs'
import {File} from '../../../src/entity/File'

let conn: Connection
let repo: Repository<Collection>
let fileRepo: Repository<File>
const url = `${backendPublicUrl}collection/`

const validFileUuids = [
  '38092c00-161d-4ca2-a29d-628cf8e960f6',
  'bde7a35f-03aa-4bff-acfb-b4974ea9f217'
]

describe('POST /api/collection', () => {

  beforeAll(async () => {
    conn = await createConnection('test')
    repo = conn.getRepository('collection')
    fileRepo = conn.getRepository('regular_file')

    // Populate necessary table
    return fileRepo.save(JSON.parse((await fsp.readFile('fixtures/2-regular_file.json')).toString()))
  })

  beforeEach(async () => {
    return repo.delete({})
  })

  afterAll(() => conn.close())

  it('on valid new collection inserts a row to db and responds with uuid', async () => {
    const res = await axios.post(url, {files: validFileUuids})
    return expect(repo.findOneOrFail(res.data)).resolves.toBeTruthy()
  })

  it('on invalid request responds with 422', async () => {
    return expect(axios.post(url, {file: validFileUuids})).rejects
      .toMatchObject(genResponse(422, {errors: ['Request is missing field "files"']}))
  })

  it('on missing files responds with 422', async () => {
    const missingUuid = validFileUuids.concat(['48092c00-161d-4ca2-a29d-628cf8e960f6'])
    return expect(axios.post(url, {files: missingUuid})).rejects
      .toMatchObject(genResponse(422, {errors: ['Following files do not exist: 48092c00-161d-4ca2-a29d-628cf8e960f6']}))
  })
})
