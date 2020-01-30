import { File } from '../../src/entity/File'
import { createConnection, Repository, Connection } from 'typeorm'
import { readFileSync } from 'fs'
import { spawn } from 'child_process'

const bucharestXml = 'tests/data/20190723_bucharest_classification.xml'
let conn: Connection
let repo: Repository<File>
beforeAll(async () => {
    conn = await createConnection('test')
    conn.synchronize(true) // Clean db
    repo = conn.getRepository(File)
})

afterAll(async () => {
    return conn.close()
})

function readXmlIn(filename: string) {
    return new Promise((resolve, _) => {
        const xml: string = readFileSync(filename, 'utf-8')
        const proc = spawn('node', ['build/metadata2db.js'])
        proc.stdin.write(xml)
        proc.stdin.end()
        proc.on('exit', resolve)
    })
}

test('inserts a row to db on valid XML', async () => {
    await readXmlIn(bucharestXml)
    return expect(repo.find()).resolves.toHaveLength(1)
})