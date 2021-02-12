import {backendPrivateUrl, backendPublicUrl} from '../../lib'
import axios from 'axios'
import {readResources} from '../../../../shared/lib'

const protectedUrl = `${backendPrivateUrl}upload/metadata/`
const privateUrl = `${backendPrivateUrl}upload-metadata/`

let responses: any
let expected: any

beforeAll(async () => {
  responses = (await readResources())['uploaded-metadata']
  expected = responses[0]
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
  it('without arguments responds with a list of all uploaded metadata sorted by size', async () => {
    return expect(axios.get(`${privateUrl}`)).resolves.toMatchObject({status: 200, data: responses})
  })

  it('responds with correct object when filtering with date', async () => {
    return expect(axios.get(`${privateUrl}`, {params: {dateFrom: '2020-08-11', dateTo: '2020-08-11'}})).resolves.toMatchObject({status: 200, data: [responses[5]]})
  })

  it('responds with correct object when filtering with site', async () => {
    return expect(axios.get(`${privateUrl}`, {params: {site: 'macehead'}})).resolves.toMatchObject({status: 200, data: [responses[1]]})
  })

  it('responds with correct object when filtering with status', async () => {
    return expect(axios.get(`${privateUrl}`, {params: {status: 'processed'}})).resolves.toMatchObject({status: 200, data: [responses[3], responses[6], responses[7]]})
  })
})

describe('GET /api/uploaded-metadata', () => {
  const publicUrl = `${backendPublicUrl}uploaded-metadata/`
  it('responds with correct object when filtering with site', async () => {
    return expect(axios.get(`${publicUrl}`, {params: {site: 'bucharest'}}))
      .resolves.toMatchObject({status: 200, data: [
        {instrument: responses[7]['instrument']},
        {instrument: responses[8]['instrument']}
      ]})
  })
})
