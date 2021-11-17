import axios from 'axios'
import {Connection, createConnection} from 'typeorm/'
import {backendPrivateUrl, backendPublicUrl, str2base64} from '../../lib'
import {Status} from '../../../src/entity/Upload'
import {promises as fsp} from 'fs'

let conn: Connection
let instrumentRepo: any
let modelRepo: any
let miscUploadRepo: any

const metadataUrl = `${backendPrivateUrl}upload/metadata/`
const modelMetadataUrl = `${backendPrivateUrl}model-upload/metadata/`
const publicMetadataUrl = `${backendPublicUrl}raw-files/`
const privateMetadataUrl = `${backendPrivateUrl}upload-metadata/`
const dataUrl = `${backendPrivateUrl}upload/data/`
const modelDataUrl = `${backendPrivateUrl}model-upload/data/`

const validMetadata = {
  filename: 'file1.LV1',
  measurementDate: '2020-08-11',
  checksum: '9a0364b9e99bb480dd25e1f0284c8555',
  instrument: 'mira',
  site: 'granada'
}

const validMetadataAndStableProduct = {
  filename: 'file1.LV1',
  measurementDate: '2021-02-20',
  checksum: '3a0364b9e99bb480dd25e1f0284c8555',
  instrument: 'mira',
  site: 'bucharest'
}

const validMetadataAndVolatileProduct = {
  filename: 'file1.LV1',
  measurementDate: '2018-11-15',
  checksum: '3a0364b9e99bb480dd25e1f0284c8555',
  instrument: 'mira',
  site: 'mace-head'
}

const validModelMetadata = {
  filename: '19990101_granada_ecmwf.nc',
  measurementDate: '1999-01-01',
  checksum: '60b725f10c9c85c70d97880dfe8191b3',
  model: 'ecmwf',
  site: 'bucharest'
}

const headers = {'authorization': `Basic ${str2base64('granada:lol')}`}

beforeAll(async () => {
  conn = await createConnection()
  instrumentRepo = conn.getRepository('instrument_upload')
  modelRepo = conn.getRepository('model_upload')
  miscUploadRepo = conn.getRepository('misc_upload')
  // Make sure these tables are initialized correctly
  await conn.getRepository('regular_file').save(JSON.parse((await fsp.readFile('fixtures/2-regular_file.json')).toString()))
  await conn.getRepository('model_file').save(JSON.parse((await fsp.readFile('fixtures/2-model_file.json')).toString()))
})

afterAll(async () => {
  await Promise.all([
    instrumentRepo.delete({}),
    modelRepo.delete({})
  ])
  return conn.close()
})

describe('POST /upload/metadata', () => {

  beforeEach(async () => {
    return await instrumentRepo.delete({})
  })

  test('inserts new metadata', async () => {
    const now = new Date()
    await expect(axios.post(metadataUrl, validMetadata, {headers})).resolves.toMatchObject({status: 200})
    const md = await instrumentRepo.findOne({checksum: validMetadata.checksum})
    expect(md).toBeTruthy()
    expect(new Date(md.createdAt).getTime()).toBeGreaterThan(now.getTime())
    expect(new Date(md.updatedAt).getTime()).toEqual(new Date(md.createdAt).getTime())
    return expect(md.status).toEqual(Status.CREATED)
  })

  test('inserts new metadata if different date', async () => {
    const payload = {...validMetadata}
    await expect(axios.post(metadataUrl, payload, {headers})).resolves.toMatchObject({status: 200})
    const payloadResub = {...payload, measurementDate: '2020-08-12', checksum: 'ac5c1f6c923cc8b259c2e22c7b258ee4'}
    await expect(axios.post(metadataUrl, payloadResub, {headers})).resolves.toMatchObject({status: 200})
    await instrumentRepo.findOneOrFail({checksum: payload.checksum})
    return await instrumentRepo.findOneOrFail({checksum: payloadResub.checksum})
  })

  test('inserts new metadata if different filename', async () => {
    const payload = {...validMetadata}
    await expect(axios.post(metadataUrl, payload, {headers})).resolves.toMatchObject({status: 200})
    const payloadResub = {...payload, filename: 'random_results.nc', checksum: 'ac5c1f6c923cc8b259c2e22c7b258ee4'}
    await expect(axios.post(metadataUrl, payloadResub, {headers})).resolves.toMatchObject({status: 200})
    await instrumentRepo.findOneOrFail({checksum: payload.checksum})
    return await instrumentRepo.findOneOrFail({checksum: payloadResub.checksum})
  })

  test('inserts new metadata if different instrument', async () => {
    const payload = {...validMetadata}
    await expect(axios.post(metadataUrl, payload, {headers})).resolves.toMatchObject({status: 200})
    const payloadResub = {...payload, instrument: 'hatpro', checksum: 'ac5c1f6c923cc8b259c2e22c7b258ee4'}
    await expect(axios.post(metadataUrl, payloadResub, {headers})).resolves.toMatchObject({status: 200})
    await instrumentRepo.findOneOrFail({checksum: payload.checksum})
    return await instrumentRepo.findOneOrFail({checksum: payloadResub.checksum})
  })

  test('inserts new metadata for misc upload', async () => {
    const now = new Date()
    const payload = {...validMetadata, instrument: 'halo-doppler-lidar'}
    await expect(axios.post(metadataUrl, payload, {headers})).resolves.toMatchObject({status: 200})
    const md = await miscUploadRepo.findOne({checksum: validMetadata.checksum})
    expect(md).toBeTruthy()
    expect(new Date(md.createdAt).getTime()).toBeGreaterThan(now.getTime())
    expect(new Date(md.updatedAt).getTime()).toEqual(new Date(md.createdAt).getTime())
    return expect(md.status).toEqual(Status.CREATED)
  })

  test('updates existing metadata', async () => {
    const payload = {...validMetadata}
    const expectedResponse = {status: 200, data: 'OK'}
    await expect(axios.post(metadataUrl, payload, {headers})).resolves.toMatchObject(expectedResponse)
    const md = await instrumentRepo.findOne({checksum: payload.checksum})
    expect(md.checksum).toBe(validMetadata.checksum)
    const initialTime = new Date(md.updatedAt).getTime()
    const payloadResub = {...payload, checksum: 'ac5c1f6c923cc8b259c2e22c7b258ee4'}
    await expect(axios.post(metadataUrl, payloadResub, {headers})).resolves.toMatchObject(expectedResponse)
    expect(await instrumentRepo.findOne({checksum: payload.checksum})).toBe(undefined)
    const mdResub = await instrumentRepo.findOne(md.uuid)
    expect(mdResub.checksum).toBe(payloadResub.checksum)
    const ResubTime = new Date(mdResub.updatedAt).getTime()
    return expect(ResubTime).toBeGreaterThan(initialTime)
  })

  test('updates existing metadata if stable product', async () => {
    const payload = {...validMetadataAndStableProduct}
    await expect(axios.post(metadataUrl, payload, {headers})).resolves.toMatchObject({status: 200})
    const payloadResub = {...payload, checksum: 'ac5c1f6c923cc8b259c2e22c7b258ee4'}
    await expect(axios.post(metadataUrl, payloadResub, {headers})).resolves.toMatchObject({status: 200})
    await instrumentRepo.findOneOrFail({checksum: payloadResub.checksum})
    const md = await instrumentRepo.findOne({checksum: payload.checksum})
    return expect(md).toBe(undefined)
  })

  test('updates existing metadata if volatile product', async () => {
    const payload = {...validMetadataAndVolatileProduct}
    await expect(axios.post(metadataUrl, payload, {headers})).resolves.toMatchObject({status: 200})
    const payloadResub = {...payload, checksum: 'ac5c1f6c923cc8b259c2e22c7b258ee4'}
    await expect(axios.post(metadataUrl, payloadResub, {headers})).resolves.toMatchObject({status: 200})
    await instrumentRepo.findOneOrFail({checksum: payloadResub.checksum})
    const md = await instrumentRepo.findOne({checksum: payload.checksum})
    return expect(md).toBe(undefined)
  })

  test('updates existing metadata with allowUpdate = true', async () => {
    const payload = {...validMetadata, allowUpdate: true}
    const expectedResponse = {status: 200, data: 'Warning: Ignoring obsolete allowUpdate property'}
    await expect(axios.post(metadataUrl, payload, {headers})).resolves.toMatchObject(expectedResponse)
    const md = await instrumentRepo.findOne({checksum: payload.checksum})
    expect(md.checksum).toBe(validMetadata.checksum)
    const payloadResub = {...payload, checksum: 'ac5c1f6c923cc8b259c2e22c7b258ee4'}
    await expect(axios.post(metadataUrl, payloadResub, {headers})).resolves.toMatchObject(expectedResponse)
    expect(await instrumentRepo.findOne({checksum: payload.checksum})).toBe(undefined)
    const mdResub = await instrumentRepo.findOne(md.uuid)
    return expect(mdResub.checksum).toBe(payloadResub.checksum)
  })

  test('updates existing metadata with allowUpdate = false', async () => {
    const payload = {...validMetadata, allowUpdate: false}
    const expectedResponse = {status: 200, data: 'Warning: Ignoring obsolete allowUpdate property'}
    await expect(axios.post(metadataUrl, payload, {headers})).resolves.toMatchObject(expectedResponse)
    const md = await instrumentRepo.findOne({checksum: payload.checksum})
    expect(md.checksum).toBe(validMetadata.checksum)
    const payloadResub = {...payload, checksum: 'ac5c1f6c923cc8b259c2e22c7b258ee4'}
    await expect(axios.post(metadataUrl, payloadResub, {headers})).resolves.toMatchObject(expectedResponse)
    expect(await instrumentRepo.findOne({checksum: payload.checksum})).toBe(undefined)
    const mdResub = await instrumentRepo.findOne(md.uuid)
    return expect(mdResub.checksum).toBe(payloadResub.checksum)
  })

  test('responds with 200 on existing hashsum with created status', async () => {
    await axios.post(metadataUrl, validMetadata, {headers})
    return expect(axios.post(metadataUrl, validMetadata, {headers})).resolves.toMatchObject({ status: 200})
  })

  test('responds with 422 if both model and instrument fields are specified', async () => {
    const newMetadata = {...validMetadata, model: 'ecmwf'}
    return await expect(axios.post(metadataUrl, newMetadata, {headers})).rejects.toMatchObject({ response: { status: 422}})
  })

  test('responds with 409 on existing hashsum with uploaded status', async () => {
    const now = new Date()
    const uploadedMetadata = {
      ...validMetadata,
      status: Status.UPLOADED, uuid: 'ca2b8ff0-c7e4-427f-894a-e6cf1ff2b8d1',
      createdAt: now, updatedAt: now}
    await instrumentRepo.save(uploadedMetadata)
    await expect(axios.post(metadataUrl, validMetadata, {headers})).rejects.toMatchObject({ response: { status: 409}})
    const md = await instrumentRepo.findOne({checksum: validMetadata.checksum})
    return expect(new Date(md.updatedAt).getTime()).toEqual(now.getTime())
  })

  test('responds with 409 on existing hashsum with allowUpdate=True and instrument data', async () => {
    const now = new Date()
    const uploadedMetadata = {
      ...validMetadata,
      status: Status.UPLOADED, uuid: 'ca2b8ff0-c7e4-427f-894a-e6cf1ff2b8d1',
      allowUpdate: true, createdAt: now, updatedAt: now}
    const newUpload = {...validMetadata, allowUpdate: true}
    await instrumentRepo.save(uploadedMetadata)
    await expect(axios.post(metadataUrl, newUpload, {headers})).rejects.toMatchObject({ response: { status: 409}})
    const md = await instrumentRepo.findOne({checksum: uploadedMetadata.checksum})
    return expect(new Date(md.updatedAt).getTime()).toEqual(now.getTime())
  })

  test('responds with 422 on missing filename', async () => {
    const payload = {...validMetadata, filename: undefined}
    return expect(axios.post(metadataUrl, payload, {headers})).rejects.toMatchObject({ response: { status: 422}})
  })

  test('responds with 422 on missing measurementDate', async () => {
    const payload = {...validMetadata, measurementDate: undefined}
    return expect(axios.post(metadataUrl, payload, {headers})).rejects.toMatchObject({ response: { status: 422}})
  })

  test('responds with 422 on invalid measurementDate', async () => {
    const payload = {...validMetadata, measurementDate: 'July'}
    return expect(axios.post(metadataUrl, payload, {headers})).rejects.toMatchObject({ response: { status: 422}})
  })

  test('responds with 422 on missing checksum', async () => {
    const payload = {...validMetadata, checksum: undefined}
    return expect(axios.post(metadataUrl, payload, {headers})).rejects.toMatchObject({ response: { status: 422}})
  })

  test('responds with 422 on invalid checksum', async () => {
    const payload = {...validMetadata, checksum: '293948'}
    return expect(axios.post(metadataUrl, payload, {headers})).rejects.toMatchObject({ response: { status: 422}})
  })

  test('responds with 422 on missing instrument', async () => {
    const payload = {...validMetadata, instrument: undefined}
    return expect(axios.post(metadataUrl, payload, {headers})).rejects.toMatchObject({ response: { status: 422}})
  })

  test('responds with 422 on invalid instrument', async () => {
    const payload = {...validMetadata, instrument: 'kukko'}
    return expect(axios.post(metadataUrl, payload, {headers})).rejects.toMatchObject({ response: { status: 422}})
  })

  test('responds with 400 on missing site', async () => {
    const payload = {...validMetadata, site: undefined}
    return expect(axios.post(metadataUrl, payload)).rejects.toMatchObject({ response: { status: 400}})
  })

  test('responds with 422 on invalid site', async () => {
    const badHeaders = {'authorization':  `Basic ${str2base64('espoo:lol')}`}
    return expect(axios.post(metadataUrl, validMetadata, {headers: badHeaders})).rejects
      .toMatchObject({ response: { status: 422}})
  })
})

describe('PUT /upload/data/:checksum', () => {
  const validUrl = `${dataUrl}${validMetadata.checksum}`
  const validFile = 'content'

  beforeEach(async () => {
    await instrumentRepo.delete({})
    return await axios.post(metadataUrl, validMetadata, {headers})
  })

  test('responds with 201 on submitting new file', async () => {
    await expect(axios.put(validUrl, validFile, {headers})).resolves.toMatchObject({ status: 201})
    const md = await instrumentRepo.findOne({checksum: validMetadata.checksum})
    expect(new Date(md.updatedAt).getTime()).toBeGreaterThan(new Date(md.createdAt).getTime())
    return expect(md.status).toEqual(Status.UPLOADED)
  })

  test('responds with 200 on submitting existing file', async () => {
    await axios.put(validUrl, validFile, {headers})
    const md1 = await instrumentRepo.findOne({checksum: validMetadata.checksum})
    await expect(axios.put(validUrl, validFile, {headers})).resolves.toMatchObject({ status: 200})
    const md2 = await instrumentRepo.findOne({checksum: validMetadata.checksum})
    return expect(new Date(md1.updatedAt).getTime()).toEqual(new Date(md2.updatedAt).getTime())
  })

  test('saves correct file size', async () => {
    await axios.put(validUrl, validFile, {headers})
    const md = await instrumentRepo.findOne({checksum: validMetadata.checksum})
    return expect(md.size).toBe(validFile.length + '') // eslint-disable-line prefer-template
  })

  test('responds with 400 on invalid hash', async () => {
    const url = `${dataUrl}file1.lv1`
    return expect(axios.put(url, validFile, {headers})).rejects.toMatchObject({ response: { status: 400}})
  })

  test('responds with 400 on incorrect hash', async () => {
    const invalidFile = 'invalidhash'
    return expect(axios.put(validUrl, invalidFile, {headers})).rejects.toMatchObject({ response: {status: 400}})
  })

  test('responds with 500 on internal errors', async () => {
    const invalidFile = 'servererr'
    return expect(axios.put(validUrl, invalidFile, {headers})).rejects.toMatchObject({ response: {status: 500}})
  })

  test('responds with 400 on nonexistent hash', async () => {
    const url = `${dataUrl}9a0364b9e99bb480dd25e1f0284c8554`
    return expect(axios.put(url, validFile, {headers})).rejects.toMatchObject({ response: { status: 400}})
  })

  test('responds with 400 when submitting data from a wrong site', async () => {
    const now = new Date()
    const headers = {'authorization': `Basic ${str2base64('martinlaakso:lol')}`}
    await expect(axios.put(validUrl, validFile, {headers}))
      .rejects.toMatchObject({ response: { status: 400}})
    const md = await instrumentRepo.findOne({checksum: validMetadata.checksum})
    return expect(new Date(md.updatedAt).getTime()).toBeLessThan(now.getTime())
  })
})

describe('PUT /model-upload/data/:checksum', () => {

  beforeEach(async () => {
    await modelRepo.delete({})
    return axios.post(modelMetadataUrl, validModelMetadata, {headers})
  })

  test('responds with 201 on submitting new file', async () => {
    const validModelUrl = `${modelDataUrl}${validModelMetadata.checksum}`
    const validFile = 'content'
    await expect(axios.put(validModelUrl, validFile, {headers})).resolves.toMatchObject({status: 201})
    const md = await modelRepo.findOne({checksum: validModelMetadata.checksum})
    return expect(md.status).toEqual(Status.UPLOADED)
  })

})

describe('POST /model-upload/metadata', () => {

  const metaData = {
    filename: '20200122_bucharest_icon-iglo-12-23.nc',
    measurementDate: '2020-01-22',
    checksum: '30b725f10c9c85c70d97880dfe8191b3',
    model: 'icon-iglo-12-23',
    site: 'bucharest',
  }

  beforeEach(async () => {
    await modelRepo.delete({})
  })

  //test('responds with 409 if stable file exists', async () => {
  //  return expect(axios.post(modelMetadataUrl, metaData, {headers})).rejects.toMatchObject({ response: { status: 409}})
  //})

  test('inserts metadata if volatile file exists', async () => {
    const payload = {...metaData, measurementDate: '2020-05-12'}
    await expect(axios.post(modelMetadataUrl, payload, {headers})).resolves.toMatchObject({status: 200})
    return await modelRepo.findOneOrFail({checksum: metaData.checksum})
  })

  test('inserts new metadata and takes site from metadata', async () => {
    await expect(axios.post(modelMetadataUrl, validModelMetadata, {headers})).resolves.toMatchObject({status: 200})
    const md = await modelRepo.findOne({checksum: validModelMetadata.checksum}, { relations: ['site', 'model'] })
    return expect(md.site.id).toBe(validModelMetadata.site)
  })

  test('updates metadata submitted with allowUpdate flag', async () => {
    const payload = {...validMetadata, instrument: undefined, allowUpdate: true, model: 'ecmwf'}
    await expect(axios.post(modelMetadataUrl, payload, {headers})).resolves.toMatchObject({status: 200})
    const md = await modelRepo.findOne({checksum: payload.checksum})
    await modelRepo.update(md.uuid, {updatedAt: '2020-11-07'})
    const payloadResub = {...payload, checksum: 'ac5c1f6c923cc8b259c2e22c7b258ee4'}
    await expect(axios.post(modelMetadataUrl, payloadResub, {headers})).resolves.toMatchObject({status: 200})
    const mdResub = await modelRepo.findOne(md.uuid)
    return expect(mdResub.checksum).toBe(payloadResub.checksum)
  })

  test('responds with 409 on existing hashsum with allowUpdate=True', async () => {
    const now = new Date()
    const uploadedMetadata = {
      ...validMetadata,
      status: Status.UPLOADED, uuid: 'ca2b8ff0-c7e4-427f-894a-e6cf1ff2b8d2',
      allowUpdate: true, model: 'ecmwf', createdAt: now, updatedAt: now, instrument: undefined}
    const newUpload = {...validMetadata, allowUpdate: true, model: 'ecmwf', instrument: undefined}
    await modelRepo.save(uploadedMetadata)
    await expect(axios.post(modelMetadataUrl, newUpload, {headers})).rejects.toMatchObject({ response: { status: 409}})
    const md = await modelRepo.findOne({checksum: uploadedMetadata.checksum})
    return expect(new Date(md.updatedAt).getTime()).toEqual(now.getTime())
  })

  test('responds with 422 on missing model', async () => {
    const payload = {...validModelMetadata, model: undefined}
    return expect(axios.post(modelMetadataUrl, payload, {headers})).rejects.toMatchObject({ response: { status: 422}})
  })

  test('responds with 422 on invalid model', async () => {
    const payload = {...validModelMetadata, model: 'kukko'}
    return expect(axios.post(modelMetadataUrl, payload, {headers})).rejects.toMatchObject({ response: { status: 422}})
  })

  test('responds with 422 on empty model', async () => {
    const payload = {...validModelMetadata, model: ''}
    return expect(axios.post(modelMetadataUrl, payload, {headers})).rejects.toMatchObject({ response: { status: 422}})
  })

  test('responds with 422 on missing site', async () => {
    const payload = {...validModelMetadata, site: undefined}
    return expect(axios.post(modelMetadataUrl, payload, {headers})).rejects.toMatchObject({ response: { status: 422}})
  })

  test('responds with 422 on empty site', async () => {
    const payload = {...validModelMetadata, site: ''}
    return expect(axios.post(modelMetadataUrl, payload, {headers})).rejects.toMatchObject({ response: { status: 422}})
  })

  test('responds with 422 on invalid site', async () => {
    const payload = {...validModelMetadata, site: 'aksjdfksdf'}
    return expect(axios.post(modelMetadataUrl, payload, {headers})).rejects.toMatchObject({ response: { status: 422}})
  })

})

describe('POST /upload-metadata/', () => {
  let uuid: string

  beforeAll(async () => {
    await axios.post(metadataUrl, validMetadata, {headers})
    const {data} = await axios.get(publicMetadataUrl, {params: {developer: true}})
    uuid = data[0].uuid
  })

  test('updates status', async () => {
    await expect(axios.post(privateMetadataUrl, {uuid, status: Status.PROCESSED})).resolves.toMatchObject({status: 200})
    return expect(instrumentRepo.findOne(uuid)).resolves.toMatchObject({status: Status.PROCESSED})
  })

  test('updates status to invalid', async () => {
    await expect(axios.post(privateMetadataUrl, {uuid, status: 'invalid'})).resolves.toMatchObject({status: 200})
    return expect(instrumentRepo.findOne(uuid)).resolves.toMatchObject({status: 'invalid'})
  })
})
