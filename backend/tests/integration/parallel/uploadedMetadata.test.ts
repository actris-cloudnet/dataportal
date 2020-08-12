import { backendPrivateUrl } from '../../lib'
import axios from 'axios'

describe('/metadata', () => {
  const url = `${backendPrivateUrl}metadata/`

  it('responds with 200 when metadata is found', async () => {
    const validHash = '1wkf934jflaodig39gksodjg3491ldk3'
    return expect(axios.get(`${url}${validHash}`)).resolves.toMatchObject({ status: 200 })
  })

  it('responds with 404 when metadata is not found', async () => {
    const validHash = '1wkf934jflaodig39gksodjg3491ldk2'
    return expect(axios.get(`${url}${validHash}`)).rejects.toMatchObject({ response: { data: { status: 404 }}})
  })
})
