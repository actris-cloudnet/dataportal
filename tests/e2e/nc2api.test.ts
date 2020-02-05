import * as fs from 'fs'
import * as path from 'path'
import { createConnection } from 'typeorm'
import * as request from 'request-promise-native'

const dir = 'tests/data/inbox'
beforeAll(async () => {
    const files = fs.readdirSync(dir)
    for(const file of files) {
        fs.unlinkSync(path.join(dir, file))
    }
    const conn = await createConnection('test')
    await conn.synchronize(true) // Clean db
    return conn.close()
})

afterAll(async () => {
})

describe('after moving a valid NC file to inbox', () => {
    beforeAll(async () => {
        fs.copyFileSync('data/bucharest/products/classification/2019/20190723_bucharest_classification.nc', path.join(dir, '20190723_bucharest_classification.nc'))
        return new Promise((resolve, _) => setTimeout(resolve, 2000))
    })

    it('should respond with a corresponding JSON', async () => {
        return expect(request('http://localhost:3001/file/15506ea8d3574c7baf8c95dfcc34fc7d')).resolves.toBeTruthy()
    })
})