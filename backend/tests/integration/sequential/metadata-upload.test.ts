import axios from 'axios'
import {Connection, createConnection} from 'typeorm/index'
import {backendPrivateUrl} from '../../lib'
import {Status} from '../../../src/entity/UploadedMetadata'

let conn: Connection
let repo: any

const url = `${backendPrivateUrl}metadata/`
const validMetadata = {
  filename: 'file1.LV1',
  measurementDate: '2020-08-11',
  hashSum: 'dc460da4ad72c482231e28e688e01f2778a88ce31a08826899d54ef7183998b5',
  product: 'radar',
  site: 'granada'
}
const validUrl = `${url}${validMetadata.hashSum}`

describe('PUT /metadata', () => {
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
    await expect(axios.put(validUrl, validMetadata)).resolves.toMatchObject({status: 201})
    return expect(repo.findOneOrFail(validMetadata.hashSum)).resolves.toBeTruthy()
  })

  test('responds with 201 on existing hashsum with created status', async () => {
    await axios.put(validUrl, validMetadata)
    return expect(axios.put(validUrl, validMetadata)).resolves.toMatchObject({ status: 201})
  })

  test('responds with 200 on existing hashsum with uploaded status', async () => {
    let uploadedMetadata = {...validMetadata, ...{hash: validMetadata.hashSum, status: Status.UPLOADED}}
    delete uploadedMetadata.hashSum
    await repo.save(uploadedMetadata)
    await axios.put(validUrl, validMetadata)
    return expect(axios.put(validUrl, validMetadata)).resolves.toMatchObject({ status: 200})
  })

  test('responds with 422 on missing filename', async () => {
    const payload = {...validMetadata}
    delete payload.filename
    return expect(axios.put(validUrl, payload)).rejects.toMatchObject({ response: { data: { status: 422}}})
  })

  test('responds with 422 on missing measurementDate', async () => {
    const payload = {...validMetadata}
    delete payload.measurementDate
    return expect(axios.put(validUrl, payload)).rejects.toMatchObject({ response: { data: { status: 422}}})
  })

  test('responds with 422 on invalid measurementDate', async () => {
    let payload = {...validMetadata}
    payload.measurementDate = 'July'
    return expect(axios.put(validUrl, payload)).rejects.toMatchObject({ response: { data: { status: 422}}})
  })

  test('responds with 422 on missing hashSum', async () => {
    const payload = {...validMetadata}
    delete payload.measurementDate
    return expect(axios.put(validUrl, payload)).rejects.toMatchObject({ response: { data: { status: 422}}})
  })

  test('responds with 422 on invalid hashSum', async () => {
    let payload = {...validMetadata}
    payload.hashSum = '293948'
    return expect(axios.put(validUrl, payload)).rejects.toMatchObject({ response: { data: { status: 422}}})
  })

  test('responds with 422 on missing product', async () => {
    const payload = {...validMetadata}
    delete payload.product
    return expect(axios.put(validUrl, payload)).rejects.toMatchObject({ response: { data: { status: 422}}})
  })

  test('responds with 422 on invalid product', async () => {
    let payload = {...validMetadata}
    payload.product = 'kukko'
    return expect(axios.put(validUrl, payload)).rejects.toMatchObject({ response: { data: { status: 422}}})
  })

  test('responds with 422 on missing site', async () => {
    let payload = {...validMetadata}
    delete payload.site
    return expect(axios.put(validUrl, payload)).rejects.toMatchObject({ response: { data: { status: 422}}})
  })

  test('responds with 422 on invalid site', async () => {
    let payload = {...validMetadata}
    payload.site = 'kukko'
    return expect(axios.put(validUrl, payload)).rejects.toMatchObject({ response: { data: { status: 422}}})
  })
})
