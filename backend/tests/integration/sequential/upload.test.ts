import axios from 'axios'
import {Connection, createConnection} from 'typeorm/index'
import {backendPrivateUrl} from '../../lib'
import {Status} from '../../../src/entity/Upload'

let conn: Connection
let repo: any

const metadataUrl = `${backendPrivateUrl}upload/metadata/`
const dataUrl = `${backendPrivateUrl}upload/data/`
const validMetadata = {
  filename: 'file1.LV1',
  measurementDate: '2020-08-11',
  checksum: '9a0364b9e99bb480dd25e1f0284c8555',
  instrument: 'mira',
  site: 'granada'
}

const validModelMetadata = {
  filename: '19990101_granada_ecmwf.nc',
  measurementDate: '1999-01-01',
  checksum: '691a2a67e1d9e95e96ce963075942e2f',
  model: 'ecmwf',
  site: 'granada'
}

const str2base64 = (hex: string) =>
  Buffer.from(hex, 'utf8').toString('base64')
const headers = {'authorization': `Basic ${str2base64('granada:lol')}`}

beforeAll(async () => {
  conn = await createConnection('test')
  repo = conn.getRepository('upload')
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
    await expect(axios.post(metadataUrl, validMetadata, {headers})).resolves.toMatchObject({status: 200})
    const md = await repo.findOne({checksum: validMetadata.checksum})
    expect(md).toBeTruthy()
    expect(new Date(md.createdAt).getTime()).toBeGreaterThan(now.getTime())
    expect(new Date(md.updatedAt).getTime()).toEqual(new Date(md.createdAt).getTime())
    return expect(md.status).toEqual(Status.CREATED)
  })

  test('inserts new model metadata', async () => {
    const now = new Date()
    await expect(axios.post(metadataUrl, validModelMetadata, {headers})).resolves.toMatchObject({status: 200})
    const md = await repo.findOne({checksum: validModelMetadata.checksum})
    expect(md).toBeTruthy()
    expect(new Date(md.createdAt).getTime()).toBeGreaterThan(now.getTime())
    expect(new Date(md.updatedAt).getTime()).toEqual(new Date(md.createdAt).getTime())
    return expect(md.status).toEqual(Status.CREATED)
  })

  test('responds with 200 on existing hashsum with created status', async () => {
    await axios.post(metadataUrl, validMetadata, {headers})
    return expect(axios.post(metadataUrl, validMetadata, {headers})).resolves.toMatchObject({ status: 200})
  })

  test('responds with 409 on existing hashsum with uploaded status', async () => {
    const now = new Date()
    let uploadedMetadata = {
      ...validMetadata,
      ...{status: Status.UPLOADED, uuid: 'ca2b8ff0-c7e4-427f-894a-e6cf1ff2b8d1',
        createdAt: now, updatedAt: now}}
    await repo.save(uploadedMetadata)
    await expect(axios.post(metadataUrl, validMetadata, {headers})).rejects.toMatchObject({ response: { data: { status: 409}}})
    const md = await repo.findOne({checksum: validMetadata.checksum})
    return expect(new Date(md.updatedAt).getTime()).toEqual(now.getTime())
  })

  test('responds with 422 on missing filename', async () => {
    const payload = {...validMetadata}
    delete payload.filename
    return expect(axios.post(metadataUrl, payload, {headers})).rejects.toMatchObject({ response: { data: { status: 422}}})
  })

  test('responds with 422 on missing measurementDate', async () => {
    const payload = {...validMetadata}
    delete payload.measurementDate
    return expect(axios.post(metadataUrl, payload, {headers})).rejects.toMatchObject({ response: { data: { status: 422}}})
  })

  test('responds with 422 on invalid measurementDate', async () => {
    let payload = {...validMetadata}
    payload.measurementDate = 'July'
    return expect(axios.post(metadataUrl, payload, {headers})).rejects.toMatchObject({ response: { data: { status: 422}}})
  })

  test('responds with 422 on missing checksum', async () => {
    const payload = {...validMetadata}
    delete payload.measurementDate
    return expect(axios.post(metadataUrl, payload, {headers})).rejects.toMatchObject({ response: { data: { status: 422}}})
  })

  test('responds with 422 on invalid checksum', async () => {
    let payload = {...validMetadata}
    payload.checksum = '293948'
    return expect(axios.post(metadataUrl, payload, {headers})).rejects.toMatchObject({ response: { data: { status: 422}}})
  })

  test('responds with 422 on missing instrument', async () => {
    const payload = {...validMetadata}
    delete payload.instrument
    return expect(axios.post(metadataUrl, payload, {headers})).rejects.toMatchObject({ response: { data: { status: 422}}})
  })

  test('responds with 422 on invalid instrument', async () => {
    let payload = {...validMetadata}
    payload.instrument = 'kukko'
    return expect(axios.post(metadataUrl, payload, {headers})).rejects.toMatchObject({ response: { data: { status: 422}}})
  })

  test('responds with 422 on missing model', async () => {
    const payload = {...validModelMetadata}
    delete payload.model
    return expect(axios.post(metadataUrl, payload, {headers})).rejects.toMatchObject({ response: { data: { status: 422}}})
  })

  test('responds with 422 on invalid model', async () => {
    let payload = {...validModelMetadata}
    payload.model = 'kukko'
    return expect(axios.post(metadataUrl, payload, {headers})).rejects.toMatchObject({ response: { data: { status: 422}}})
  })

  test('responds with 422 on both model and instrument defined', async () => {
    let payload = {...validModelMetadata, instrument: 'chm15k'}
    return expect(axios.post(metadataUrl, payload, {headers})).rejects.toMatchObject({ response: { data: { status: 422}}})
  })

  test('responds with 400 on missing site', async () => {
    let payload = {...validMetadata}
    delete payload.site
    return expect(axios.post(metadataUrl, payload)).rejects.toMatchObject({ response: { data: { status: 400}}})
  })

  test('responds with 422 on invalid site', async () => {
    let payload = {...validMetadata}
    const badHeaders = {'authorization':  `Basic ${str2base64('espoo:lol')}`}
    return expect(axios.post(metadataUrl, payload, {headers: badHeaders})).rejects
      .toMatchObject({ response: { data: { status: 422}}})
  })
})

describe('PUT /upload/data/:checksum', () => {
  const validUrl = `${dataUrl}${validMetadata.checksum}`
  const validFile = 'content'
  beforeEach(async () => {
    await repo.delete({})
    return axios.post(metadataUrl, validMetadata, {headers})
  })

  test('responds with 201 on submitting new file', async () => {
    await expect(axios.put(validUrl, validFile, {headers})).resolves.toMatchObject({ status: 201})
    const md = await repo.findOne({checksum: validMetadata.checksum})
    expect(new Date(md.updatedAt).getTime()).toBeGreaterThan(new Date(md.createdAt).getTime())
    return expect(md.status).toEqual(Status.UPLOADED)
  })

  test('responds with 200 on submitting existing file', async () => {
    await axios.put(validUrl, validFile, {headers})
    const md1 = await repo.findOne({checksum: validMetadata.checksum})
    await expect(axios.put(validUrl, validFile, {headers})).resolves.toMatchObject({ status: 200})
    const md2 = await repo.findOne({checksum: validMetadata.checksum})
    return expect(new Date(md1.updatedAt).getTime()).toEqual(new Date(md2.updatedAt).getTime())
  })

  test('responds with 400 on invalid hash', async () => {
    const url = `${dataUrl}file1.lv1`
    return expect(axios.put(url, validFile, {headers})).rejects.toMatchObject({ response: { data: { status: 400}}})
  })

  /*  mock-aws-s3 does not check hashes, so this test will fail. Must test manually.
  test('responds with 400 on incorrect hash', async () => {
    const invalidFile = 'invalid'
    return expect(axios.put(validUrl, invalidFile, {headers})).rejects.toMatchObject({ response: { data: { status: 400}}})
  })

   */

  test('responds with 400 on nonexistent hash', async () => {
    const url = `${dataUrl}9a0364b9e99bb480dd25e1f0284c8554`
    return expect(axios.put(url, validFile, {headers})).rejects.toMatchObject({ response: { data: { status: 400}}})
  })

  test('responds with 400 when submitting data from a wrong site', async () => {
    const now = new Date()
    const headers = {'authorization': `Basic ${str2base64('martinlaakso:lol')}`}
    await expect(axios.put(validUrl, validFile, {headers}))
      .rejects.toMatchObject({ response: { data: { status: 400}}})
    const md = await repo.findOne({checksum: validMetadata.checksum})
    return expect(new Date(md.updatedAt).getTime()).toBeLessThan(now.getTime())
  })
})
