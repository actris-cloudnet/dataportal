import { basename, resolve } from 'path'
import {backendPrivateUrl, backendPublicUrl, clearDir, publicVizDir} from '../../lib'
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

const url = `${backendPublicUrl}visualizations/`
const privUrl = `${backendPrivateUrl}visualizations/`
describe('PUT /visualizations', () => {

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

describe('GET /visualizations', () => {

  it('on no results returns empty list and responds with 200', async () => {
    const res = await axios.get(url, {headers, params: {product: 'lidar'}})
    expect(res.status).toEqual(200)
    return expect(res.data).toEqual([])
  })

  it('on valid search returns correct list of visualizations and responds with 200', async () => {
    const expectedResult = [{
      sourceFileId: '38092c00-161d-4ca2-a29d-628cf8e960f6',
      locationHumanReadable: 'Mace Head',
      productHumanReadable: 'Radar',
      visualizations: [
        {
          filename: 'test0.png',
          'productVariable': {'id': 'test1', 'humanReadableName': 'Auringonpaisteen määrä', 'order': '1'}
        },
        {
          filename: 'test1.png',
          'productVariable': {'id': 'test2', 'humanReadableName': 'Kaljanhimo', 'order': '0'}
        }]
    }]
    const res = await axios.get(url, {headers, params: {product: 'radar'}})
    expect(res.status).toEqual(200)
    return expect(res.data).toMatchObject(expectedResult)
  })
})

describe('GET /visualizations/:uuid', () => {

  it('returns correct list of visualizations and responds with 200', async () => {
    const expectedResult = {
      sourceFileId: '38092c00-161d-4ca2-a29d-628cf8e960f6',
      locationHumanReadable: 'Mace Head',
      productHumanReadable: 'Radar',
      visualizations: [
        {
          filename: 'test0.png',
          'productVariable': {'id': 'test1', 'humanReadableName': 'Auringonpaisteen määrä', 'order': '1'}
        },
        {
          filename: 'test1.png',
          'productVariable': {'id': 'test2', 'humanReadableName': 'Kaljanhimo', 'order': '0'}
        }]
    }
    const res = await axios.get(`${url}${expectedResult.sourceFileId}`)
    expect(res.status).toEqual(200)
    return expect(res.data).toMatchObject(expectedResult)
  })
})
