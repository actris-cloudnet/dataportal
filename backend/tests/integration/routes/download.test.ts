import { backendPublicUrl, genResponse } from '../../lib'
import { RequestError } from '../../../src/entity/RequestError'
import axios from 'axios'

describe('/api/download', () => {
  const url = `${backendPublicUrl}download/`

  it('responds with 400 if no results were found', async () => {
    let expectedBody: RequestError = {
      status: 400,
      errors: ['No files match the query']
    }
    const payload = { params: { dateTo: new Date('1970-02-20') } }
    expect(axios.get(url, payload)).rejects.toMatchObject(genResponse(expectedBody.status, expectedBody))
  })

  it('responds with 500 if files that exist in db do not exist on disk', async () => {
    const payload = { params: { location: 'bucharest' } }
    expect(axios.get(url, payload)).rejects.toMatchObject({ response: { status: 500 }})
  })
})
