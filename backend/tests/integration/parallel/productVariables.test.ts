import {backendPublicUrl} from '../../lib'
import axios from 'axios'
import {readResources} from '../../../../shared/lib'

describe('/api/products', () => {
  const url = `${backendPublicUrl}products/variables`
  let responses: any

  beforeAll(async () => (responses = await readResources()))

  it('responds with a json including normal products', async () => {
    const res = await axios.get(url)
    return expect(res.data).toMatchObject(responses['products'])
  })
})

describe('/api/products/variables', () => {
  const url = `${backendPublicUrl}products/variables`
  let responses: any

  beforeAll(async () => (responses = await readResources()))

  it('responds with a json including variables', async () => {
    const res = await axios.get(url)
    return expect(res.data).toMatchObject(responses['products-with-variables'])
  })
})

