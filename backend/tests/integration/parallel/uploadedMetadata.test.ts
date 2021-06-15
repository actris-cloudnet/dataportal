import {backendPrivateUrl, backendPublicUrl} from '../../lib'
import axios from 'axios'
import {readResources} from '../../../../shared/lib'

const protectedUrl = `${backendPrivateUrl}upload/metadata/`
const privateUrl = `${backendPrivateUrl}upload-metadata/`
const privateModelUrl = `${backendPrivateUrl}upload-model-metadata/`

let instResp: any
let modelResp: any
let expected: any

beforeAll(async () => {
  const responses = await readResources()
  instResp = responses['uploaded-metadata']
  modelResp = responses['uploaded-model-metadata']
  expected = instResp[0]
})

describe('GET /upload/metadata/:checksum', () => {

  it('responds with 200 when metadata is found', async () => {
    const validId = expected.checksum
    return expect(axios.get(`${protectedUrl}${validId}`)).resolves.toMatchObject({ status: 200, data: expected })
  })

  it('responds with 400 when hash is invalid', async () => {
    const invalidHash = '123456789012345678'
    return expect(axios.get(`${protectedUrl}${invalidHash}`)).rejects.toMatchObject({ response: { status: 400 }})
  })

  it('responds with 404 when hash is not found', async () => {
    const invalidHash = '12345678901234567892123456789012'
    return expect(axios.get(`${protectedUrl}${invalidHash}`)).rejects.toMatchObject({ response: { status: 404 }})
  })

})

describe('GET /upload-metadata', () => {
  it('without arguments responds with a list of all uploaded instrument files sorted by size', async () => {
    return expect(axios.get(`${privateUrl}`)).resolves.toMatchObject({status: 200, data: instResp})
  })

  it('responds with correct object when filtering with date', async () => {
    return expect(axios.get(`${privateUrl}`, {params: {dateFrom: '2020-08-11', dateTo: '2020-08-11'}})).resolves.toMatchObject({status: 200, data: [instResp[0]]})
  })

  it('responds with correct object when filtering with site', async () => {
    return expect(axios.get(`${privateUrl}`, {params: {site: 'granada'}})).resolves.toMatchObject({status: 200, data: [instResp[0]]})
  })

  it('responds with correct object when filtering with status', async () => {
    return expect(axios.get(`${privateUrl}`, {params: {status: 'processed'}})).resolves.toMatchObject({status: 200, data: [instResp[1], instResp[2]]})
  })

  it('responds with correct object when filtering with instrument', async () => {
    return expect(axios.get(`${privateUrl}`, {params: {instrument: 'mira'}})).resolves.toMatchObject({status: 200, data: [instResp[0], instResp[3]]})
  })

  it('responds with correct object when filtering with updatedAt', async () => {
    return expect(axios.get(`${privateUrl}`, {params: {updatedAtFrom: '2020-09-27T00:00:00.000Z', updatedAtTo: '2020-09-28T00:00:00.000Z'}})).resolves.toMatchObject({status: 200, data: [instResp[0]]})
  })
})

describe('GET /upload-model-metadata', () => {
  it('without arguments responds with a list of all uploaded instrument files sorted by size', async () => {
    return expect(axios.get(`${privateModelUrl}`)).resolves.toMatchObject({status: 200, data: modelResp})
  })

  it('responds with correct object when filtering with model', async () => {
    return expect(axios.get(`${privateModelUrl}`, {params: {model: 'icon-iglo-12-23'}})).resolves.toMatchObject({status: 200, data: [modelResp[2], modelResp[3]]})
  })
})

describe('GET /api/uploaded-metadata', () => {
  const publicUrl = `${backendPublicUrl}uploaded-metadata/`
  it('responds with correct object when filtering with site', async () => {
    return expect(axios.get(`${publicUrl}`, {params: {site: 'bucharest'}}))
      .resolves.toMatchObject({status: 200, data: [
        {instrument: instResp[2]['instrument']},
        {instrument: instResp[3]['instrument']}
      ]})
  })
})

describe('GET /dateforsize', () => {
  const publicUrl = `${backendPrivateUrl}dateforsize/`
  it('responds with date corresponding with the target size', async () => {
    return expect(axios.get(`${publicUrl}`, {params: {startDate: '2020-09-27T12:45:21.916Z', targetSize: '30'}}))
      .resolves.toMatchObject({status: 200, data: '2020-09-28T12:47:21.916Z'})
  })

  it('responds with 400 if there is not enough data', async () => {
    return expect(axios.get(`${publicUrl}`, {params: {startDate: '2020-09-28T12:47:21.916Z', targetSize: '30'}}))
      .rejects.toMatchObject({response: {status: 400}})
  })
})
