import { File } from '../../src/entity/File'
import { createConnection, Repository, Connection } from 'typeorm'
import { readFileSync } from 'fs'
import { spawn } from 'child_process'

const bucharestXml = 'tests/data/20190723_bucharest_classification.xml'
const bucharestXmlMissing = 'tests/data/20190723_bucharest_classification_missing_fields.xml'
let conn: Connection
let repo: Repository<File>
beforeAll(async () => {
    conn = await createConnection('test')
    await conn.synchronize(true) // Clean db
    repo = conn.getRepository(File)
})

afterAll(async () => {
    return conn.close()
})

function readXmlIn(filename: string): Promise<string> {
    return new Promise((resolve, _) => {
        const xml: string = readFileSync(filename, 'utf-8')
        const proc = spawn('node', ['build/metadata2db.js'])
        let out: string
        proc.stderr.on('data', data => out += data)
        proc.on('exit', () => resolve(out))
        proc.stdin.write(xml)
        proc.stdin.end()
    })
}

test('errors on missing XML fields', async () =>  {
    const out = await readXmlIn(bucharestXmlMissing)
    expect(out).toMatch('Failed to import NetCDF XML to DB:')
    expect(out).toMatch('cloudnet_file_type')
    return expect(out).toMatch('file_uuid')
})

describe('after reading a valid XML', () => {
    beforeAll(async () => readXmlIn(bucharestXml))

    afterAll(async () =>
        repo.clear()
    )

    test('inserts a row to db', async () => {
        return expect(repo.find()).resolves.toHaveLength(1)
    })

    test('errors when inserting XML with same UUID', async () => {
        const out = await readXmlIn(bucharestXml)
        expect(out).toMatch('Failed to import NetCDF XML to DB:')
        return expect(repo.find()).resolves.toHaveLength(1)
    })
})