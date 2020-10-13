import { backendPublicUrl, genResponse } from '../../lib'
import { RequestError } from '../../../src/entity/RequestError'
import axios from 'axios'

describe('/api/download', () => {
  const url = `${backendPublicUrl}download/`

  it('responds with 404 if collection is not found', async () => {
    let expectedBody: RequestError = {
      status: 404,
      errors: ['No collection matches this UUID.']
    }
    return expect(axios.get(`${url}25506ea8-d357-4c7b-af8c-95dfcc34fc7d`)).rejects
      .toMatchObject(genResponse(expectedBody.status, expectedBody))
  })

  it('responds with 500 if files that exist in db do not exist on disk', async () => {
    return expect(axios.get(`${url}48092c00-161d-4ca2-a29d-628cf8e960f6`)).rejects
      .toMatchObject({ response: { status: 500 }})
  })
})
