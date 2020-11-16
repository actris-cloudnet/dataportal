import axios from 'axios'
import {Connection, createConnection} from 'typeorm/index'
import {backendPrivateUrl} from '../../lib'
import {Status} from '../../../src/entity/Upload'
import * as express from 'express'
import {Server} from 'http'

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
let server: Server

const str2base64 = (hex: string) =>
  Buffer.from(hex, 'utf8').toString('base64')
const headers = {'authorization': `Basic ${str2base64('granada:lol')}`}

beforeAll(async () => {
  conn = await createConnection('test')
  repo = conn.getRepository('upload')
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

  test('updates metadata with allowUpdate flag', async () => {
    // new submission with allowUpdate flag
    const payload = {...validMetadata, allowUpdate: true}
    await expect(axios.post(metadataUrl, payload, {headers})).resolves.toMatchObject({status: 200})
    const md = await repo.findOne({checksum: payload.checksum})
    expect(md.checksum).toBe(validMetadata.checksum)
    const initial_time = new Date(md.updatedAt).getTime()
    // submit same metadata with different checksum
    const new_checksum = 'ac5c1f6c923cc8b259c2e22c7b258ee4'
    const payload_resub = {...payload, checksum: new_checksum}
    await expect(axios.post(metadataUrl, payload_resub, {headers})).resolves.toMatchObject({status: 200})
    const md_resub = await repo.findOne(md.uuid)
    expect(md_resub.checksum).toBe(new_checksum)
    const resub_time = new Date(md_resub.updatedAt).getTime()
    return expect(resub_time).toBeGreaterThan(initial_time)
  })

  test('works with string type allowUpdate flag too', async () => {
    // new submission with allowUpdate flag
    const payload = {...validMetadata, allowUpdate: 'TrUe'}
    await expect(axios.post(metadataUrl, payload, {headers})).resolves.toMatchObject({status: 200})
    const md = await repo.findOne({checksum: payload.checksum})
    expect(md.checksum).toBe(validMetadata.checksum)
    const new_checksum = 'ac5c1f6c923cc8b259c2e22c7b258ee4'
    const payload_resub = {...payload, checksum: new_checksum}
    await expect(axios.post(metadataUrl, payload_resub, {headers})).resolves.toMatchObject({status: 200})
    const md_resub = await repo.findOne(md.uuid)
    expect(md_resub.checksum).toBe(new_checksum)
  })

  test('refuses to update file after certain time period', async () => {
    // new submission with allowUpdate flag
    const payload = {...validMetadata, allowUpdate: 'TrUe'}
    await expect(axios.post(metadataUrl, payload, {headers})).resolves.toMatchObject({status: 200})
    const md = await repo.findOne({checksum: payload.checksum})
    await repo.update(md.uuid, {updatedAt: '2020-11-07'})
    const new_checksum = 'ac5c1f6c923cc8b259c2e22c7b258ee4'
    const payload_resub = {...payload, checksum: new_checksum}
    await expect(axios.post(metadataUrl, payload_resub, {headers})).rejects.toMatchObject({ response: { status: 409}})
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
    await expect(axios.post(metadataUrl, validMetadata, {headers})).rejects.toMatchObject({ response: { status: 409}})
    const md = await repo.findOne({checksum: validMetadata.checksum})
    return expect(new Date(md.updatedAt).getTime()).toEqual(now.getTime())
  })

  test('responds with 422 on missing filename', async () => {
    const payload = {...validMetadata}
    delete payload.filename
    return expect(axios.post(metadataUrl, payload, {headers})).rejects.toMatchObject({ response: { status: 422}})
  })

  test('responds with 422 on missing measurementDate', async () => {
    const payload = {...validMetadata}
    delete payload.measurementDate
    return expect(axios.post(metadataUrl, payload, {headers})).rejects.toMatchObject({ response: { status: 422}})
  })

  test('responds with 422 on invalid measurementDate', async () => {
    let payload = {...validMetadata}
    payload.measurementDate = 'July'
    return expect(axios.post(metadataUrl, payload, {headers})).rejects.toMatchObject({ response: { status: 422}})
  })

  test('responds with 422 on missing checksum', async () => {
    const payload = {...validMetadata}
    delete payload.measurementDate
    return expect(axios.post(metadataUrl, payload, {headers})).rejects.toMatchObject({ response: { status: 422}})
  })

  test('responds with 422 on invalid checksum', async () => {
    let payload = {...validMetadata}
    payload.checksum = '293948'
    return expect(axios.post(metadataUrl, payload, {headers})).rejects.toMatchObject({ response: { status: 422}})
  })

  test('responds with 422 on missing instrument', async () => {
    const payload = {...validMetadata}
    delete payload.instrument
    return expect(axios.post(metadataUrl, payload, {headers})).rejects.toMatchObject({ response: { status: 422}})
  })

  test('responds with 422 on invalid instrument', async () => {
    let payload = {...validMetadata}
    payload.instrument = 'kukko'
    return expect(axios.post(metadataUrl, payload, {headers})).rejects.toMatchObject({ response: { status: 422}})
  })

  test('responds with 400 on missing site', async () => {
    let payload = {...validMetadata}
    delete payload.site
    return expect(axios.post(metadataUrl, payload)).rejects.toMatchObject({ response: { status: 400}})
  })

  test('responds with 422 on invalid site', async () => {
    let payload = {...validMetadata}
    const badHeaders = {'authorization':  `Basic ${str2base64('espoo:lol')}`}
    return expect(axios.post(metadataUrl, payload, {headers: badHeaders})).rejects
      .toMatchObject({ response: { status: 422}})
  })
})

describe('PUT /upload/data/:checksum', () => {
  const validUrl = `${dataUrl}${validMetadata.checksum}`
  const validFile = 'content'

  beforeAll(next => {
    const app = express()
    app.put('/cloudnet-upload/*', (req, res, _next) =>{
      req.on('data', chunk => {
        const chunkStr = chunk.toString()
        if (chunkStr == 'content') return res.status(201).send({size: chunk.length})
        if (chunkStr == 'invalidhash') return res.status(400).send('Checksum does not match file contents')
        if (chunkStr == 'servererr') return res.sendStatus(400)
        return res.sendStatus(500)
      })
    })
    server = app.listen(5910, next)
    return
  })

  afterAll(next => {
    server.close(next)
  })

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

  test('saves correct file size', async () => {
    await axios.put(validUrl, validFile, {headers})
    const md = await repo.findOne({checksum: validMetadata.checksum})
    return expect(md.size).toBe(validFile.length)
  })

  test('responds with 400 on invalid hash', async () => {
    const url = `${dataUrl}file1.lv1`
    return expect(axios.put(url, validFile, {headers})).rejects.toMatchObject({ response: { status: 400}})
  })

  test('responds with 400 on incorrect hash', async () => {
    const invalidFile = 'invalidhash'
    return expect(axios.put(validUrl, invalidFile, {headers})).rejects.toMatchObject({ response: { data: { status: 400}}})
  })

  test('responds with 500 on internal errors', async () => {
    const invalidFile = 'servererr'
    return expect(axios.put(validUrl, invalidFile, {headers})).rejects.toMatchObject({ response: { data: { status: 500}}})
  })

  test('responds with 400 on nonexistent hash', async () => {
    const url = `${dataUrl}9a0364b9e99bb480dd25e1f0284c8554`
    return expect(axios.put(url, validFile, {headers})).rejects.toMatchObject({ response: { status: 400}})
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

describe('POST /model-upload/metadata', () => {
  beforeEach(async () => {
    await repo.delete({})
  })

  const modelMetadataUrl = `${backendPrivateUrl}model-upload/metadata/`

  const validModelMetadata = {
    filename: '19990101_granada_ecmwf.nc',
    measurementDate: '1999-01-01',
    checksum: '60b725f10c9c85c70d97880dfe8191b3',
    model: 'ecmwf',
    site: 'bucharest'
  }

  test('inserts new model metadata and takes site from metadata', async () => {
    await expect(axios.post(modelMetadataUrl, validModelMetadata, {headers})).resolves.toMatchObject({status: 200})
    const md = await repo.findOne({checksum: validModelMetadata.checksum}, { relations: ['site', 'model'] })
    return expect(md.site.id).toBe(validModelMetadata.site)
  })

  test('responds with 422 on missing model', async () => {
    const payload = {...validModelMetadata}
    delete payload.model
    return expect(axios.post(modelMetadataUrl, payload, {headers})).rejects.toMatchObject({ response: { status: 422}})
  })

  test('responds with 422 on invalid model', async () => {
    let payload = {...validModelMetadata}
    payload.model = 'kukko'
    return expect(axios.post(modelMetadataUrl, payload, {headers})).rejects.toMatchObject({ response: { status: 422}})
  })

  test('responds with 422 on empty model', async () => {
    let payload = {...validModelMetadata}
    payload.model = ''
    return expect(axios.post(modelMetadataUrl, payload, {headers})).rejects.toMatchObject({ response: { status: 422}})
  })

  test('responds with 422 on missing site', async () => {
    let payload = {...validModelMetadata}
    delete payload.site
    return expect(axios.post(modelMetadataUrl, payload, {headers})).rejects.toMatchObject({ response: { status: 422}})
  })

  test('responds with 422 on empty site', async () => {
    let payload = {...validModelMetadata}
    payload.site = ''
    return expect(axios.post(modelMetadataUrl, payload, {headers})).rejects.toMatchObject({ response: { status: 422}})
  })

  test('responds with 422 on invalid site', async () => {
    let payload = {...validModelMetadata}
    payload.site = 'aksjdfksdf'
    return expect(axios.post(modelMetadataUrl, payload, {headers})).rejects.toMatchObject({ response: { status: 422}})
  })

})

