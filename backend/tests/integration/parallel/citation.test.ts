import {backendPublicUrl, genResponse} from '../../lib'
import axios from 'axios'
import {readResources} from '../../../../shared/lib'

const url = `${backendPublicUrl}citation/`
let resources: any

beforeAll(async () => {
  resources = await readResources()
})

describe('GET /api/citation', () => {

  it('responds with a list of citations for a site', async () => {
    const res = await axios.get(url, { params: { site: 'bucharest' }})
    expect(res.data).toHaveLength(1)
    expect(res.data).toMatchObject(resources['citation'].slice(1))
  })

  it('responds with an empty list if no citations are found', async () => {
    const res = await axios.get(url, { params: { site: 'macehead' }})
    expect(res.data).toHaveLength(0)
  })

  it('responds with an error if no site is provided', async () => {
    return expect(axios.get(url)).rejects.toMatchObject({response: { status: 422}})
  })
})
