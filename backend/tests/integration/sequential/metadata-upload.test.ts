import axios from 'axios'
import {Connection, createConnection} from 'typeorm/index'
import {backendPrivateUrl} from '../../lib'
import {Status} from '../../../src/entity/UploadedMetadata'

let conn: Connection
let repo: any

const url = `${backendPrivateUrl}upload/metadata/`
const validMetadata = {
  filename: 'file1.LV1',
  measurementDate: '2020-08-11',
  hashSum: 'dc460da4ad72c482231e28e688e01f27',
  instrument: 'mira',
  site: 'granada'
}
const validId = validMetadata.hashSum.substr(0, 18)
const validUrl = `${url}${validId}`


beforeAll(async () => {
  conn = await createConnection('test')
  repo = conn.getRepository('uploaded_metadata')
  return
})

afterAll(async () => {
  await repo.delete({})
  return conn.close()
})

describe('PUT /upload/metadata', () => {
  beforeEach(() => {
    return repo.delete({})
  })

  test('inserts new metadata', async () => {
    const now = new Date()
    await expect(axios.post(validUrl, validMetadata)).resolves.toMatchObject({status: 200})
    const md = await repo.findOne({hashSum: validMetadata.hashSum})
    expect(md).toBeTruthy()
    expect(new Date(md.createdAt).getTime()).toBeGreaterThan(now.getTime())
    expect(new Date(md.updatedAt).getTime()).toEqual(new Date(md.createdAt).getTime())
  })

  test('responds with 200 on existing hashsum with created status', async () => {
    await axios.post(validUrl, validMetadata)
    return expect(axios.post(validUrl, validMetadata)).resolves.toMatchObject({ status: 200})
  })

  test('responds with 409 on existing hashsum with uploaded status', async () => {
    let uploadedMetadata = {...validMetadata, ...{hash: validMetadata.hashSum, status: Status.UPLOADED, id: validId,
      createdAt: new Date(), updatedAt: new Date()}}
    delete uploadedMetadata.hashSum
    await repo.save(uploadedMetadata)
    await axios.put(validUrl, validMetadata)
    return expect(axios.put(validUrl, validMetadata)).resolves.toMatchObject({ status: 409})
  })

  test('responds with 422 on invalid id', async () => {
    const invalidUrl = `${url}1234567890123456789`
    return expect(axios.put(invalidUrl, validMetadata)).rejects.toMatchObject({ response: { data: { status: 422}}})
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

  test('responds with 422 on missing instrument', async () => {
    const payload = {...validMetadata}
    delete payload.instrument
    return expect(axios.put(validUrl, payload)).rejects.toMatchObject({ response: { data: { status: 422}}})
  })

  test('responds with 422 on invalid instrument', async () => {
    let payload = {...validMetadata}
    payload.instrument = 'kukko'
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
