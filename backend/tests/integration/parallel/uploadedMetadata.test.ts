import { backendPrivateUrl } from '../../lib'
import axios from 'axios'
import {readResources} from '../../../../shared/lib'

const url = `${backendPrivateUrl}metadata/`

let responses: any
let expected: any

beforeAll(async () => {
  responses = (await readResources())['uploaded-metadata']
  expected = responses[0]
})

describe('GET /metadata/:hash', () => {

  it('responds with 200 when metadata is found', async () => {
    const validHash = expected.hash
    return expect(axios.get(`${url}${validHash}`)).resolves.toMatchObject({ status: 200, data: expected })
  })

  it('responds with 200 when metadata is found with shorter hash', async () => {
    const validHash = 'dc460da4ad72c48223'
    return expect(axios.get(`${url}${validHash}`)).resolves.toMatchObject({ status: 200, data: expected })
  })

  it('responds with 404 when metadata is not found', async () => {
    const invalidHash = 'dc460da4ad72c482231e28e688e01f2778a88ce31a08826899d54ef7183998b4'
    return expect(axios.get(`${url}${invalidHash}`)).rejects.toMatchObject({ response: { data: { status: 404 }}})
  })

  it('responds with 400 when attempting to find metadata with too short hash', async () => {
    const invalidHash = 'dc460da4ad72c4822'
    return expect(axios.get(`${url}${invalidHash}`)).rejects.toMatchObject({ response: { data: { status: 400 }}})
  })

})

describe('GET /metadata', () => {
  it('without arguments responds with a list of all uploaded metadata', async () => {
    return expect(axios.get(`${url}`)).resolves.toMatchObject({status: 200, data: responses})
  })

  it('responds with correct object when filtering with date', async () => {
    return expect(axios.get(`${url}`, {params: {dateFrom: '2020-08-11', dateTo: '2020-08-11'}})).resolves.toMatchObject({status: 200, data: [responses[0]]})
  })

  it('responds with correct object when filtering with site', async () => {
    return expect(axios.get(`${url}`, {params: {site: 'bucharest'}})).resolves.toMatchObject({status: 200, data: [responses[1]]})
  })

  it('responds with correct object when filtering with status', async () => {
    return expect(axios.get(`${url}`, {params: {status: 'processed'}})).resolves.toMatchObject({status: 200, data: [responses[1]]})
  })
})
