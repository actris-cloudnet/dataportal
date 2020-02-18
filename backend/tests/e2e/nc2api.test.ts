import * as fs from 'fs'
import * as path from 'path'
import { createConnection } from 'typeorm'
import * as request from 'request-promise-native'


function clearDir(dir: string) {
    const files = fs.readdirSync(dir)
    for(const file of files) {
        fs.unlinkSync(path.join(dir, file))
    }
}
const inboxDir = 'tests/data/inbox'
const publicDir = 'tests/data/public'

beforeAll(async () => {
    clearDir(inboxDir)
    clearDir(publicDir)
    const conn = await createConnection('test')
    await conn.synchronize(true) // Clean db
    return conn.close()
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