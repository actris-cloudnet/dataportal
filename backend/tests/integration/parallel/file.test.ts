import { backendPublicUrl } from '../../lib'
import axios from 'axios'
import { RequestError } from '../../../src/entity/RequestError'

const testUuid = '9e04d8ef-0f2b-4823-835d-33e458403c67'

describe('/api/files', () => {
  const url = `${backendPublicUrl}files/`
  const expectedBody404: RequestError = {
    status: 404,
    errors: [ 'No files match this UUID' ]
  }

  it('responds with a 404 on test file if in normal mode', async () => {
    return expect(axios.get(url + testUuid)).rejects.toMatchObject({ response: { data: expectedBody404 }})
  })

  it('request succeeds on a test file in developer mode', async () => {
    return expect(axios.get(url + testUuid, { params: { developer: '' }})).resolves.toBeTruthy()
  })

  it('returns newest file by default', async () => {
    const res = await axios.get(url, { params: { product: 'categorize' }})
    expect(res.data).toHaveLength(1)
    expect(res.data[0].uuid === '6cb32746-faf0-4057-9076-ed2e698dcf36').toBeTruthy()
  })

  it('returns optionally all versions of a file sorted by releasedAt', async () => {
    const res = await axios.get(url, { params: { product: 'categorize', allVersions: '' }})
    expect(res.data).toHaveLength(2)
    expect(res.data[0].releasedAt > res.data[1].releasedAt).toBeTruthy()
  })

})
