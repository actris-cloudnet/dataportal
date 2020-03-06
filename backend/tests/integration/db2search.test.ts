import { backendUrl } from '../lib'
import axios, { AxiosRequestConfig } from 'axios'
import { RequestError } from '../../src/entity/RequestError'

describe('/files', () => {

  it('should respond with 400 if no query parameters are given', async () => {
    const expectedBody: RequestError = {
      status: 400,
      errors: [ 'No search parameters given' ]
    }
    return expect(axios.get(`${backendUrl}files/`)).rejects.toMatchObject({response: {status: expectedBody.status, data: expectedBody}})
  })

  it('should respond with an array of 3 objects when searching for macehead', async () => {
    const payload: AxiosRequestConfig = {
      params: {
        location: 'macehead'
      }
    }
    const res = await axios.get(`${backendUrl}files/`, payload)
    expect(res).toHaveProperty('data')
    return expect(res.data).toHaveLength(3)
  })

  it('should respond with an array of 4 objects when searching for macehead and hyytiala', async () => {
    const payload: AxiosRequestConfig = {
      params: {
        location: ['macehead', 'hyytiala']
      }
    }
    const res = await axios.get(`${backendUrl}files/`, payload)
    expect(res).toHaveProperty('data')
    expect(res.data).toHaveLength(4)
    return expect(res.data.map((d: any) => d.site.id)).toEqual(['macehead', 'macehead', 'macehead', 'hyytiala'])
  })

  it('should respond with 404 if location was not found', async () => {
    const expectedBody: RequestError = {
      status: 404,
      errors: 'Not found'
    }
    const payload: AxiosRequestConfig = {
      params: {
        location: 'kilpikonna'
      }
    }
    return expect(axios.get(`${backendUrl}files/`, payload)).rejects.toMatchObject({response: {status: expectedBody.status, data: expectedBody}})
  })
})
