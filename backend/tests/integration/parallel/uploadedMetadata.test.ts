import { backendPrivateUrl } from '../../lib'
import axios from 'axios'

const expected = {
  'hash': 'dc460da4ad72c482231e28e688e01f2778a88ce31a08826899d54ef7183998b5',
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
    const validHash = expected.hash
    return expect(axios.get(`${url}${validHash}`)).resolves.toMatchObject({ status: 200, data: expected })
  })

  it('responds with 404 when metadata is not found', async () => {
    const invalidHash = 'dc460da4ad72c482231e28e688e01f2778a88ce31a08826899d54ef7183998b4'
    return expect(axios.get(`${url}${invalidHash}`)).rejects.toMatchObject({ response: { data: { status: 404 }}})
  })
})
