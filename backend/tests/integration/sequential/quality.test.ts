import {Connection, createConnection, Repository} from 'typeorm'
import {QualityReport} from '../../../src/entity/QualityReport'
import axios from 'axios'
import {backendPrivateUrl, backendPublicUrl} from '../../lib'


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
  return qualityRepo.delete({})
})

afterAll(async () => {
  await qualityRepo.delete({})
  await conn.close()
})


describe('PUT /quality/:uuid', () => {
  const privateUrl = `${backendPrivateUrl}quality/`
  const publicUrl = `${backendPublicUrl}quality/`
  const fileUrl = `${backendPublicUrl}files/`

  it('on new report responds with 201 and creates report', async () => {
    await expect(axios.put(`${privateUrl}acf78456-11b1-41a6-b2de-aa7590a75675`, validPayload))
      .resolves.toMatchObject({status: 201})
    await expect(axios.get(`${fileUrl}acf78456-11b1-41a6-b2de-aa7590a75675`))
      .resolves.toMatchObject({status: 200, data: {qualityScore: validPayload.overallScore}})
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
