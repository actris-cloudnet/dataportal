import {File} from '../../../src/entity/File'
import axios from 'axios'
import {Connection, createConnection, Repository} from 'typeorm/index'
import {backendProtectedUrl} from '../../lib'

let conn: Connection
let repo: Repository<File>

const url = `${backendProtectedUrl}upload-metadata/`
const validMetadata = {
  filename: 'file1.LV1',
  measurementDate: '2020-08-11',
  hashSum: 'dc460da4ad72c482231e28e688e01f2778a88ce31a08826899d54ef7183998b5',
  product: 'radar'
}
const config = {
  auth: {
    username: 'granada',
    password: 'test'
  }
}

describe('/protected/upload-metadata', () => {
  beforeAll(async () => {
    conn = await createConnection('test')
    repo = conn.getRepository('uploaded_metadata')
    return
  })


  beforeEach(() => {
    return repo.delete({})
  })

  afterAll(() => {
    return conn.close()
  })

  test('inserts new metadata', async () => {
    await expect(axios.post(url, validMetadata, config)).resolves.toMatchObject({status: 200})
    return expect(repo.findOneOrFail(validMetadata.hashSum)).resolves.toBeTruthy()
  })

  test('responds with 400 on existing hashsum', async () => {
    await axios.post(url, validMetadata, config)
    return expect(axios.post(url, validMetadata, config)).rejects.toMatchObject({ response: { data: { status: 400}}})
  })

  test('responds with 400 on missing filename', async () => {
    const payload = {...validMetadata}
    delete payload.filename
    return expect(axios.post(url, payload, config)).rejects.toMatchObject({ response: { data: { status: 400}}})
  })

  test('responds with 400 on missing measurementDate', async () => {
    const payload = {...validMetadata}
    delete payload.measurementDate
    return expect(axios.post(url, payload, config)).rejects.toMatchObject({ response: { data: { status: 400}}})
  })

  test('responds with 400 on invalid measurementDate', async () => {
    let payload = {...validMetadata}
    payload.measurementDate = 'July'
    return expect(axios.post(url, payload, config)).rejects.toMatchObject({ response: { data: { status: 400}}})
  })

  test('responds with 400 on missing hashSum', async () => {
    const payload = {...validMetadata}
    delete payload.measurementDate
    return expect(axios.post(url, payload, config)).rejects.toMatchObject({ response: { data: { status: 400}}})
  })

  test('responds with 400 on invalid hashSum', async () => {
    let payload = {...validMetadata}
    payload.hashSum = '293948'
    return expect(axios.post(url, payload, config)).rejects.toMatchObject({ response: { data: { status: 400}}})
  })

  test('responds with 400 on missing product', async () => {
    const payload = {...validMetadata}
    delete payload.product
    return expect(axios.post(url, payload, config)).rejects.toMatchObject({ response: { data: { status: 400}}})
  })

  test('responds with 400 on invalid product', async () => {
    let payload = {...validMetadata}
    payload.product = 'kukko'
    return expect(axios.post(url, payload, config)).rejects.toMatchObject({ response: { data: { status: 400}}})
  })

  test('responds with 400 on invalid username / station id', async () => {
    let invalidConfig = {...config}
    invalidConfig.auth.username = 'nonexistent'
    return expect(axios.post(url, validMetadata, config)).rejects.toMatchObject({ response: { data: { status: 400}}})
  })

  test('responds with 400 on missing authorization header', async () => {
    return expect(axios.post(url, validMetadata)).rejects.toMatchObject({ response: { data: { status: 400}}})
  })
})
