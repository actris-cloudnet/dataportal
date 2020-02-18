import * as fs from 'fs'
import * as path from 'path'
import * as request from 'request-promise-native'
import { clearDir, inboxDir, publicDir, clearDb } from '../lib'

beforeAll(async () => {
  clearDir(inboxDir)
  clearDir(publicDir)
  return clearDb()
})

afterAll(async () => {
})

describe('after moving a valid NC file to inbox', () => {
  beforeAll(async () => {
    fs.copyFileSync('tests/data/20190723_bucharest_classification.nc', path.join(inboxDir, '20190723_bucharest_classification.nc'))
    return new Promise((resolve, _) => setTimeout(resolve, 3000))
  })

  it('should respond with a corresponding JSON', async () => {
    return expect(request('http://localhost:3001/file/15506ea8d3574c7baf8c95dfcc34fc7d')).resolves.toBeTruthy()
  })
})