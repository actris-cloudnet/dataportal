import axios from 'axios'
import {backendPublicUrl, genResponse} from '../../lib'
import {Connection, createConnection, Repository} from 'typeorm'
import {Collection} from '../../../src/entity/Collection'

const url = `${backendPublicUrl}generate-pid/`

const validRequest = {
  type: 'collection',
  uuid: '48092c00-161d-4ca2-a29d-628cf8e960f6'
}
const response = {pid: 'testpid'}
let conn: Connection
let repo: Repository<Collection>

beforeAll(async () => {
  conn = await createConnection()
  repo = conn.getRepository('collection')
})

describe('POST /api/generate-pid', () => {
  afterAll(async () => conn.close())

  it('responds with a pid and adds it to the collection', async () => {
    await repo.update({uuid: validRequest.uuid}, {pid: ''})
    const res = await axios.post(url, validRequest)
    expect(res.data).toMatchObject(response)
    return expect(repo.findOneOrFail(validRequest.uuid)).resolves.toMatchObject({pid: response.pid})
  })

  it('responds with 403 if collection already has a PID', async () => {
    await repo.update({uuid: validRequest.uuid}, {pid: 'asd'})
    const error = { errors: ['Collection already has a PID'] }
    await expect(axios.post(url, validRequest)).rejects.toMatchObject(genResponse(403, error))
  })

  it('responds with 422 if type or uuid is missing', async () => {
    const error = { errors: ['Missing or invalid uuid or type'] }
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

  it('responds with 504 if PID service does not respond in time', async () => {
    await repo.update({uuid: validRequest.uuid}, {pid: ''})
    const error = { errors: ['PID service took too long to respond'] }
    await expect(axios.post(url, {...validRequest, ...{wait: true}})).rejects.toMatchObject(genResponse(504, error))
  })
})
