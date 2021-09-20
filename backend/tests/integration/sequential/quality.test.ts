import {Connection, createConnection, Repository} from 'typeorm'
import {QualityReport} from '../../../src/entity/QualityReport'
import axios from 'axios'
import {backendPrivateUrl, backendPublicUrl} from '../../lib'
import {promises as fsp} from 'fs'


let conn: Connection
let qualityRepo: Repository<QualityReport>

const validPayload = {
  'overallScore': 0.92,
  'metadata': {
    'missingVariables': ['XYZ'],
    'missingGlobalAttributes': ['KISSA'],
    'invalidGlobalAttributeValues': [],
    'invalidUnits': ['height', 'altitude']
  },
  'data': {
    'outOfBounds': ['width', 'v_sigma']
  }
}


beforeAll(async () => {
  conn = await createConnection()
  qualityRepo = conn.getRepository('quality_report')
})

beforeEach(async () => {
  await qualityRepo.delete({})
  // File fixtures are needed here
  await conn.getRepository('regular_file').save(JSON.parse((await fsp.readFile('fixtures/2-regular_file.json')).toString()))
  await conn.getRepository('model_file').save(JSON.parse((await fsp.readFile('fixtures/2-model_file.json')).toString()))
  return conn.getRepository('search_file').save(JSON.parse((await fsp.readFile('fixtures/2-search_file.json')).toString()))
})

afterAll(async () => {
  await qualityRepo.delete({})
  await conn.getRepository('visualization').delete({})
  await conn.getRepository('regular_file').delete({})
  await conn.getRepository('model_file').delete({})
  await conn.getRepository('search_file').delete({})
  await conn.close()
})


describe('PUT /quality/:uuid', () => {
  const privateUrl = `${backendPrivateUrl}quality/`
  const publicUrl = `${backendPublicUrl}quality/`
  const fileUrl = `${backendPublicUrl}files/`
  const searchUrl = `${backendPublicUrl}search/`

  it('on new report responds with 201 and creates report', async () => {
    await expect(axios.put(`${privateUrl}acf78456-11b1-41a6-b2de-aa7590a75675`, validPayload))
      .resolves.toMatchObject({status: 201})
    await expect(axios.get(`${fileUrl}acf78456-11b1-41a6-b2de-aa7590a75675`))
      .resolves.toMatchObject({status: 200, data: {qualityScore: validPayload.overallScore}})
    const res = await axios.get(searchUrl, {params: { dateFrom: '2021-02-20' }})
    expect(res.data[0]).toMatchObject({qualityScore: validPayload.overallScore})
    return expect(axios.get(`${publicUrl}acf78456-11b1-41a6-b2de-aa7590a75675`))
      .resolves.toMatchObject({status: 200, data: validPayload})
  })

  it('on existing report responds with 200 and updates report', async () => {
    await expect(axios.put(`${privateUrl}acf78456-11b1-41a6-b2de-aa7590a75675`, validPayload))
      .resolves.toMatchObject({status: 201})
    const tmpPayload = {...validPayload, overallScore: 0.8}
    await expect(axios.put(`${privateUrl}acf78456-11b1-41a6-b2de-aa7590a75675`, tmpPayload))
      .resolves.toMatchObject({status: 200})
    await expect(axios.get(`${fileUrl}acf78456-11b1-41a6-b2de-aa7590a75675`))
      .resolves.toMatchObject({status: 200, data: {qualityScore: tmpPayload.overallScore}})
    return expect(axios.get(`${publicUrl}acf78456-11b1-41a6-b2de-aa7590a75675`))
      .resolves.toMatchObject({status: 200, data: tmpPayload})
  })

  it('on existing model file report responds with 200 and updates report', async () => {
    await expect(axios.put(`${privateUrl}b5d1d5af-3667-41bc-b952-e684f627d91c`, validPayload))
      .resolves.toMatchObject({status: 201})
    const tmpPayload = {...validPayload, overallScore: 0.8}
    await expect(axios.put(`${privateUrl}b5d1d5af-3667-41bc-b952-e684f627d91c`, tmpPayload))
      .resolves.toMatchObject({status: 200})
    await expect(axios.get(`${fileUrl}b5d1d5af-3667-41bc-b952-e684f627d91c`))
      .resolves.toMatchObject({status: 200, data: {qualityScore: tmpPayload.overallScore}})
    return expect(axios.get(`${publicUrl}b5d1d5af-3667-41bc-b952-e684f627d91c`))
      .resolves.toMatchObject({status: 200, data: tmpPayload})
  })

  it('fails with 400 if file does not exist', async () => {
    return expect(axios.put(`${privateUrl}4FC4577C-84BF-4557-86D8-1A1FB8D1D81E`, validPayload))
      .rejects.toMatchObject({response: {status: 400}})
  })
})
