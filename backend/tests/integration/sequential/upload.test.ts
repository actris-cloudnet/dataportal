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
const str2base64 = (hex: string) =>
  Buffer.from(hex, 'utf8').toString('base64')
const validId = validMetadata.hashSum
const headers = {'authorization': `Basic ${str2base64('granada:lol')}`}

beforeAll(async () => {
  conn = await createConnection('test')
  repo = conn.getRepository('uploaded_metadata')
  return
})

afterAll(async () => {
  await repo.delete({})
  return conn.close()
})

describe('POST /upload/metadata', () => {
  beforeEach(() => {
    return repo.delete({})
  })

  test('inserts new metadata', async () => {
    const now = new Date()
    await expect(axios.post(url, validMetadata, {headers})).resolves.toMatchObject({status: 200})
    const md = await repo.findOne({hashSum: validMetadata.hashSum})
    expect(md).toBeTruthy()
    expect(new Date(md.createdAt).getTime()).toBeGreaterThan(now.getTime())
    expect(new Date(md.updatedAt).getTime()).toEqual(new Date(md.createdAt).getTime())
  })

  test('responds with 200 on existing hashsum with created status', async () => {
    await axios.post(url, validMetadata, {headers})
    return expect(axios.post(url, validMetadata, {headers})).resolves.toMatchObject({ status: 200})
  })

  test('responds with 409 on existing hashsum with uploaded status', async () => {
    const now = new Date()
    let uploadedMetadata = {
      ...validMetadata,
      ...{status: Status.UPLOADED, uuid: 'ca2b8ff0-c7e4-427f-894a-e6cf1ff2b8d1',
        createdAt: now, updatedAt: now}}
    await repo.save(uploadedMetadata)
    await expect(axios.post(url, validMetadata, {headers})).rejects.toMatchObject({ response: { data: { status: 409}}})
    const md = await repo.findOne({hashSum: validMetadata.hashSum})
    return expect(new Date(md.updatedAt).getTime()).toEqual(now.getTime())
  })

  test('responds with 422 on missing filename', async () => {
    const payload = {...validMetadata}
    delete payload.filename
    return expect(axios.post(url, payload, {headers})).rejects.toMatchObject({ response: { data: { status: 422}}})
  })

  test('responds with 422 on missing measurementDate', async () => {
    const payload = {...validMetadata}
    delete payload.measurementDate
    return expect(axios.post(url, payload, {headers})).rejects.toMatchObject({ response: { data: { status: 422}}})
  })

  test('responds with 422 on invalid measurementDate', async () => {
    let payload = {...validMetadata}
    payload.measurementDate = 'July'
    return expect(axios.post(url, payload, {headers})).rejects.toMatchObject({ response: { data: { status: 422}}})
  })

  test('responds with 422 on missing hashSum', async () => {
    const payload = {...validMetadata}
    delete payload.measurementDate
    return expect(axios.post(url, payload, {headers})).rejects.toMatchObject({ response: { data: { status: 422}}})
  })

  test('responds with 422 on invalid hashSum', async () => {
    let payload = {...validMetadata}
    payload.hashSum = '293948'
    return expect(axios.post(url, payload, {headers})).rejects.toMatchObject({ response: { data: { status: 422}}})
  })

  test('responds with 422 on missing instrument', async () => {
    const payload = {...validMetadata}
    delete payload.instrument
    return expect(axios.post(url, payload, {headers})).rejects.toMatchObject({ response: { data: { status: 422}}})
  })

  test('responds with 422 on invalid instrument', async () => {
    let payload = {...validMetadata}
    payload.instrument = 'kukko'
    return expect(axios.post(url, payload, {headers})).rejects.toMatchObject({ response: { data: { status: 422}}})
  })

  test('responds with 400 on missing site', async () => {
    let payload = {...validMetadata}
    delete payload.site
    return expect(axios.post(url, payload)).rejects.toMatchObject({ response: { data: { status: 400}}})
  })

  test('responds with 422 on invalid site', async () => {
    let payload = {...validMetadata}
    const badHeaders = {'authorization':  `Basic ${str2base64('espoo:lol')}`}
    return expect(axios.post(url, payload, {headers: badHeaders})).rejects.toMatchObject({ response: { data: { status: 422}}})
  })
})
