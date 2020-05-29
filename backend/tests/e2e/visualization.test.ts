import * as fs from 'fs'
import axios from 'axios'
import {
  clearDir,
  clearRepo,
  fileServerUrl,
  publicVizDir,
  backendPrivateUrl
} from '../lib'
import {basename, resolve} from 'path'

let fileSize: number

const vizJson = {
  fullPath: resolve('tests/data/test-viz.png'),
  sourceFileId: '9e04d8ef-0f2b-4823-835d-33e458403c67',
  variableHumanReadableName: 'Testin onnistumistodennäköisyys',
  variableId: 'testitn'
}

const validId = basename(vizJson.fullPath)

const headers = { 'content-type': 'application/json'}

beforeAll(async () => {
  fileSize = fs.statSync(vizJson.fullPath).size
  clearDir(publicVizDir)
  return clearRepo('visualization')
})



describe('after PUTting visualization to API', () => {
  beforeAll(async () =>
    axios.put(`${backendPrivateUrl}visualization/${validId}`, vizJson, { headers })
  )

  it('serves the file', async () => {
    return axios
      .head(`${fileServerUrl}/viz/${validId}`)
      .then(response => {
        expect(response.status).toEqual(200)
        expect(parseInt(response.headers['content-length'])).toEqual(fileSize)
      })
  })
})
