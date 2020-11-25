import { basename, resolve } from 'path'
import {backendPrivateUrl, clearDir, publicVizDir} from '../../lib'
import axios from 'axios'
import {Connection, createConnection, Repository} from 'typeorm'
import {Visualization} from '../../../src/entity/Visualization'
import * as express from 'express'
import {Server} from 'http'

const validJson = {
  sourceFileId: '9e04d8ef-0f2b-4823-835d-33e458403c67',
  variableId: 'test1'
}

const badUuid = {...validJson, ...{sourceFileId: 'a0fc26e4-d448-4b93-91a3-62051c9d311b'}}

const validId = 'test.png'
const badId = 'notfound'


let conn: Connection
let repo: Repository<Visualization>
let server: Server

const privUrl = `${backendPrivateUrl}visualizations/`
describe('PUT /visualizations', () => {

  beforeAll(async () => {
    return new Promise(async (resolve, _) => {
      conn = await createConnection('test')
      repo = conn.getRepository('visualization')
      await Promise.all([
        repo.delete(badId),
        repo.delete(validId)
      ]).catch()
      const app = express()
      app.get('/*', (req, res, _next) =>{
        if (req.params[0].includes('notfound')) return res.sendStatus(404)
        res.sendStatus(200)
      })
      server = app.listen(5910, resolve)
    })
  })

  afterEach(async () =>
    Promise.all([
      repo.delete(badId),
      repo.delete(validId),
    ]).catch()
  )

  afterAll(() =>
    Promise.all([
      new Promise((r, _) => server.close(r)),
      conn.close()
    ])
  )

  it('on valid new visualization inserts a row to db and responds with 201', async () => {
    const res = await axios.put(`${privUrl}${validId}`, validJson)
    expect(res.status).toEqual(201)
    return expect(repo.findOneOrFail(validId)).resolves.toBeTruthy()
  })

  it('on invalid path responds with 400', async () =>
    expect(axios.put(`${privUrl}${badId}`, validJson)).rejects.toMatchObject({response: {status: 400}})
  )

  it('on invalid source file uuid responds with 400', async () =>
    expect(axios.put(`${privUrl}${validId}`, badUuid)).rejects.toMatchObject({response: { status: 400}})
  )

})
