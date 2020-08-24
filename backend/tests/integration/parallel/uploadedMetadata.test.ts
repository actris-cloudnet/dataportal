import { backendPrivateUrl } from '../../lib'
import axios from 'axios'

describe('GET /metadata', () => {
  const url = `${backendPrivateUrl}metadata/`

  const expected = {
    'hash': 'dc460da4ad72c482231e28e688e01f2778a88ce31a08826899d54ef7183998b5',
    'filename': 'file1.LV1',
    'measurementDate': '2020-08-11',
    'site': {
      'id': 'granada',
    },
    'product': {
      'id': 'radar',
    },
    'status': 'created'
  }

  it('responds with 200 when metadata is found', async () => {
    const validHash = expected.hash
    return expect(axios.get(`${url}${validHash}`)).resolves.toMatchObject({ status: 200, data: expected })
  })

  it('responds with 200 when metadata is not found with shorter hash', async () => {
    const validHash = 'dc460da4ad72c48223'
    return expect(axios.get(`${url}${validHash}`)).resolves.toMatchObject({ status: 200, data: expected })
  })

  it('responds with 404 when metadata is not found', async () => {
    const invalidHash = 'dc460da4ad72c482231e28e688e01f2778a88ce31a08826899d54ef7183998b4'
    return expect(axios.get(`${url}${invalidHash}`)).rejects.toMatchObject({ response: { data: { status: 404 }}})
  })

  it('responds with 400 when attempting to find metadata with too short hash', async () => {
    const invalidHash = 'dc460da4ad72c4822'
    return expect(axios.get(`${url}${invalidHash}`)).rejects.toMatchObject({ response: { data: { status: 400 }}})
  })

})

describe('POST /metadata', () => {
  const postMetadata = {
    'hash': 'ac460da4ad72c482231e28e688e01f2778a88ce31a08826899d54ef7183998b1',
    'status': 'uploaded'
  }

  const postUrl = `${backendPrivateUrl}metadata/${postMetadata.hash}`

  it('changes corresponding fields in metadata', async () => {
    await expect(axios.post(postUrl, postMetadata)).resolves.toMatchObject({ status: 200 })
    await expect(axios.get(postUrl)).resolves.toMatchObject({ status: 200, data: postMetadata })
  })
})
