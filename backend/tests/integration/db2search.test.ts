import { backendUrl } from '../lib'
import axios from 'axios'
import { RequestError } from '../../src/entity/RequestError'

describe('/files', () => {

  it('should respond with 400 if no query parameters are given', async () => {
    const expectedBody: RequestError = {
      status: 400,
      errors: [ 'No search parameters given' ]
    }
    return expect(axios.get(`${backendUrl}files/`)).rejects.toMatchObject({response: {status: 400, data: expectedBody}})
  })
})
