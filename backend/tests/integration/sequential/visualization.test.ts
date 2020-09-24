import { basename, resolve } from 'path'
import {backendPrivateUrl, clearDir, publicVizDir} from '../../lib'
import axios from 'axios'
import {Connection, createConnection, Repository} from 'typeorm'
import {Visualization} from '../../../src/entity/Visualization'

const validJson = {
  fullPath: resolve('tests/data/test-viz.png'),
  sourceFileId: '9e04d8ef-0f2b-4823-835d-33e458403c67',
  variableId: 'test1'
}

const badPath = {
  fullPath: 'data/badpath.png',
  sourceFileId: '9e04d8ef-0f2b-4823-835d-33e458403c67',
  variableId: 'test1'
}

const badUuid = {...validJson, ...{sourceFileId: 'a0fc26e4-d448-4b93-91a3-62051c9d311b'}}

const validId = basename(validJson.fullPath)
const badId = basename(badPath.fullPath)

const headers = { 'content-type': 'application/json'}

let conn: Connection
let repo: Repository<Visualization>

const privUrl = `${backendPrivateUrl}visualizations/`
describe('PUT /visualizations', () => {

  beforeAll(async () => {
    conn = await createConnection('test')
    repo = conn.getRepository('visualization')
    await Promise.all([
      repo.delete(badId),
      repo.delete(validId)
    ]).catch()
    return clearDir(publicVizDir)
  })

  afterEach(async () =>
    Promise.all([
      repo.delete(badId),
      repo.delete(validId)
    ]).catch()
  )

  afterAll(() => conn.close())

  it('on valid new visualization inserts a row to db and responds with 201', async () => {
    const res = await axios.put(`${privUrl}${validId}`, validJson, { headers })
    expect(res.status).toEqual(201)
    return expect(repo.findOneOrFail(validId)).resolves.toBeTruthy()
  })

  it('on invalid path responds with 400', async () =>
    axios.put(`${privUrl}${badId}`, badPath, { headers })
      .catch(res =>
        expect(res.response.status).toEqual(400)
      )
  )

  it('on invalid source file uuid responds with 400', async () =>
    axios.put(`${privUrl}${badId}`, badUuid, { headers })
      .catch(res =>
        expect(res.response.status).toEqual(400)
      )
  )

})
