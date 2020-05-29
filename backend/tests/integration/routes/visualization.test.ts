import { basename, resolve } from 'path'
import {backendPrivateUrl, backendPublicUrl, clearDir, publicVizDir} from '../../lib'
import axios from 'axios'
import {Connection, createConnection, Repository} from 'typeorm'
import {Visualization} from '../../../src/entity/Visualization'

const validJson = {
  fullPath: resolve('tests/data/test-viz.png'),
  sourceFileId: '9e04d8ef-0f2b-4823-835d-33e458403c67',
  variableHumanReadableName: 'Testin onnistumistodennäköisyys',
  variableId: 'testitn'
}

const badPath = {
  fullPath: 'data/badpath.png',
  sourceFileId: '9e04d8ef-0f2b-4823-835d-33e458403c67',
  variableHumanReadableName: 'Testin onnistumistodennäköisyys',
  variableId: 'testitn'
}

const badUuid = {...validJson, ...{sourceFileId: 'a0fc26e4-d448-4b93-91a3-62051c9d311b'}}

const validId = basename(validJson.fullPath)
const badId = basename(badPath.fullPath)

const headers = { 'content-type': 'application/json'}

let conn: Connection
let repo: Repository<Visualization>

const url = `${backendPublicUrl}visualization/`
const privUrl = `${backendPrivateUrl}visualization/`
describe('PUT /visualization', () => {

  beforeAll(async () => {
    conn = await createConnection('test')
    repo = conn.getRepository(Visualization)
    return clearDir(publicVizDir)
  })

  afterEach(async () =>
    Promise.all([
      repo.delete(badId),
      repo.delete(validId)
    ]).catch()
  )

  it('on valid new visualization inserts a row to db and responds with 201', async () => {
    const res = await axios.put(`${privUrl}${validId}`, validJson, { headers })
    expect(res.status).toEqual(201)
    return expect(repo.findOneOrFail(validId)).resolves.toBeTruthy()
  })

  it('on invalid path responds with 400', async () =>
    axios.put(`${url}${badId}`, badPath, { headers })
      .catch(res =>
        expect(res.response.status).toEqual(400)
      )
  )

  it('on invalid source file uuid responds with 400', async () =>
    axios.put(`${url}${badId}`, badUuid, { headers })
      .catch(res =>
        expect(res.response.status).toEqual(400)
      )
  )

})

describe('GET /visualization', () => {

  it('on no results returns empty list and responds with 200', async () => {
    const res = await axios.get(url, { headers, params: { product: 'lidar'}})
    expect(res.status).toEqual(200)
    expect(res.data).toEqual([])
  })

  it('on valid search returns correct list of visualizations and responds with 200', async () => {
    const expectedResult = [ { filename: 'test0.png',
      variableId: 'test',
      variableHumanReadableName: 'testi testinen' },
    { variableId: 'test',
      filename: 'test1.png',
      variableHumanReadableName: 'testi testinen' } ]
    const res = await axios.get(url, { headers, params: { product: 'radar'}})
    expect(res.status).toEqual(200)
    expect(res.data).toMatchObject(expectedResult)
  })

})
