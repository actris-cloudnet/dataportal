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

  it('responds with l3 products in dev mode', async () => {
    const res1 = await axios.get(url, {params: {developer: true}})
    return expect(res1.data.filter((prod: any) => prod.level == '3').length).toEqual(3)
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

