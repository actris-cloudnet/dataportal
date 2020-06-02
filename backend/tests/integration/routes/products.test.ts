import { backendPublicUrl } from '../../lib'
import axios from 'axios'

const validObject = [
  {
    'id': 'categorize',
    'humanReadableName': 'Categorize',
    'level': '1',
    'variables': [
      {
        'id': 'test1',
        'humanReadableName': 'Auringonpaisteen määrä',
        'order': '1'
      },
      {
        'id': 'test2',
        'humanReadableName': 'Kaljanhimo',
        'order': '0'
      }
    ]
  },
  {
    'id': 'radar',
    'humanReadableName': 'Radar',
    'level': '1',
    'variables': []
  },
  {
    'id': 'lwc',
    'humanReadableName': 'Liquid water content',
    'level': '2',
    'variables': []
  },
  {
    'id': 'iwc',
    'humanReadableName': 'Ice water content',
    'level': '2',
    'variables': []
  },
  {
    'id': 'classification',
    'humanReadableName': 'Classification',
    'level': '2',
    'variables': []
  },
  {
    'id': 'model',
    'humanReadableName': 'Model',
    'level': '1',
    'variables': []
  },
  {
    'id': 'drizzle',
    'humanReadableName': 'Drizzle',
    'level': '2',
    'variables': []
  },
  {
    'id': 'mwr',
    'humanReadableName': 'Microwave radiometer',
    'level': '1',
    'variables': []
  },
  {
    'id': 'lidar',
    'humanReadableName': 'Lidar',
    'level': '1',
    'variables': []
  }
]


describe('/api/products', () => {
  const url = `${backendPublicUrl}products/`

  it('responds with a json including variables', async () => {
    const res = await axios.get(url)
    return expect(res.data).toMatchObject(validObject)
  })
})

