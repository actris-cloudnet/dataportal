import axios from 'axios'
import {backendPublicUrl, genResponse} from '../../lib'
import * as express from 'express'
import {Server} from 'http'
import {Connection, createConnection, Repository} from 'typeorm'
import {Collection} from '../../../src/entity/Collection'

const url = `${backendPublicUrl}generate-pid/`

const validRequest = {
  type: 'collection',
  uuid: '48092c00-161d-4ca2-a29d-628cf8e960f6'
}
const response = {pid: 'testpid'}
let server: Server
let conn: Connection
let repo: Repository<Collection>

beforeAll(async () => {
  conn = await createConnection('test')
  repo = conn.getRepository('collection')
})

describe('POST /api/generate-pid', () => {
  beforeAll(next => {
    const app = express()
    app.post('/pid', express.json(), (req, res, next) =>{
      if (req.body.type != validRequest.type || req.body.uuid != validRequest.uuid) return res.sendStatus(400)
      res.send(response)
    })
    server = app.listen(5801, next)
  })

  afterAll(next => {
    server.close(() =>
      conn.close().then(next)
    )
  })

  it('responds with a pid and adds it to the collection', async () => {
    await repo.update({uuid: validRequest.uuid}, {pid: ''})
    const res = await axios.post(url, validRequest)
    expect(res.data).toMatchObject(response)
    return expect(repo.findOneOrFail(validRequest.uuid)).resolves.toMatchObject({pid: response.pid})
  })

  it('responds with a pid and adds it to the collection', async () => {
    await repo.update({uuid: validRequest.uuid}, {pid: 'asd'})
    const error = { errors: ['Collection already has a PID'] }
    await expect(axios.post(url, validRequest)).rejects.toMatchObject(genResponse(403, error))
  })

  it('responds with 422 if type or uuid is missing', async () => {
    const error = { errors: ['Request is missing uuid or type'] }
    await expect(axios.post(url, {type: 'collection'})).rejects.toMatchObject(genResponse(422, error))
    return expect(axios.post(url, {uuid: validRequest.uuid})).rejects.toMatchObject(genResponse(422, error))
  })

  it('responds with 422 on invalid type', async () => {
    const error = { errors: ['Type must be collection'] }
    await expect(axios.post(url, {type: 'file', uuid: validRequest.uuid})).rejects.toMatchObject(genResponse(422, error))
  })

  it('responds with 422 on missing uuid', async () => {
    const error = { errors: ['Collection not found'] }
    return expect(axios.post(url, {type: 'collection', uuid: '11092c00-161d-4ca2-a29d-628cf8e960f6'})).rejects
      .toMatchObject(genResponse(422, error))
  })
})
