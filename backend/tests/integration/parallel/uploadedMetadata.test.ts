import { backendPrivateUrl } from '../../lib'
import axios from 'axios'

const expected = {
  'hash': '1wkf934jflaodig39gksodjg3491ldk3',
  'filename': 'file1.LV1',
  'measurementDate': '2020-08-11',
  'site': {
    'id': 'granada',
  },
  'product': {
    'id': 'radar',
  }
}


describe('/metadata', () => {
  const url = `${backendPrivateUrl}metadata/`

  it('responds with 200 when metadata is found', async () => {
    const validHash = '1wkf934jflaodig39gksodjg3491ldk3'
    return expect(axios.get(`${url}${validHash}`)).resolves.toMatchObject({ status: 200, data: expected })
  })

  it('responds with 404 when metadata is not found', async () => {
    const validHash = '1wkf934jflaodig39gksodjg3491ldk2'
    return expect(axios.get(`${url}${validHash}`)).rejects.toMatchObject({ response: { data: { status: 404 }}})
  })
})
