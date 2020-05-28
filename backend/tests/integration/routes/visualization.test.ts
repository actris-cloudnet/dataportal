import { basename, resolve } from 'path'
import { backendUrl } from '../../lib'
import axios from 'axios'
import {Connection, createConnection, Repository} from 'typeorm'
import {Visualization} from '../../../src/entity/Visualization'

const validJson = {
  fullPath: resolve('tests/data/test-viz.png'),
  sourceFileId: '9e04d8ef-0f2b-4823-835d-33e458403c67',
  variableHumanReadableName: 'Testin onnistumistodennäköisyys',
  variableId: 'testitn'
}

const validId = basename(validJson.fullPath)

const headers = { 'content-type': 'application/json'}

let conn: Connection
let repo: Repository<Visualization>

describe('PUT /visualization', () => {
  const url = `${backendUrl}visualization/`

  beforeAll(async () => {
    conn = await createConnection('test')
    repo = conn.getRepository(Visualization)
  })

  afterAll(async () => repo.delete(validId))

  it('on valid new visualization inserts a row to db and responds with 201', async () => {
    const res = await axios.put(`${url}${validId}`, validJson, { headers })
    expect(res.status).toEqual(201)
    return expect(repo.findOneOrFail(validId)).resolves.toBeTruthy()
  })

})
