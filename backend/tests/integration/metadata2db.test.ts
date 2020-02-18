import { File } from '../../src/entity/File'
import { createConnection, Repository, Connection } from 'typeorm'
import { readFileSync, unlinkSync, readdirSync } from 'fs'
import { join } from 'path'
import { spawn } from 'child_process'

const bucharestXml = 'tests/data/20190723_bucharest_classification.xml'
const bucharestXmlMissing = 'tests/data/20190723_bucharest_classification_missing_fields.xml'
let conn: Connection
let repo: Repository<File>
const linkDir = 'tests/data/public'
beforeAll(async () => {
    const files = readdirSync(linkDir)
    for(const file of files) {
        unlinkSync(join(linkDir, file))
    }
    conn = await createConnection('test')
    await conn.synchronize(true) // Clean db
    repo = conn.getRepository(File)
})

afterAll(async () => {
    return conn.close()
})

function readXmlIn(filename: string, logErrors: boolean): Promise<string> {
    return new Promise((resolve, _) => {
        const xml: string = readFileSync(filename, 'utf-8')
        const proc = spawn('node', ['build/metadata2db.js'])
        let out: string
        proc.stderr.on('data', data => {
            if(logErrors) console.error(data.toString())
            out += data
        })
        proc.on('exit', () => resolve(out))
        proc.stdin.write(xml)
        proc.stdin.end()
    })
}

test('errors on missing XML fields', async () =>  {
    const out = await readXmlIn(bucharestXmlMissing, false)
    expect(out).toMatch('Failed to import NetCDF XML to DB:')
    expect(out).toMatch('cloudnet_file_type')
    return expect(out).toMatch('file_uuid')
})

describe('after reading a valid XML', () => {
    beforeAll(async () => readXmlIn(bucharestXml, true))

    afterAll(async () =>
        repo.clear()
    )

    test('inserts a row to db', async () => {
        return expect(repo.find()).resolves.toHaveLength(1)
    })

    test('errors when inserting XML with same UUID', async () => {
        const out = await readXmlIn(bucharestXml, false)
        expect(out).toMatch('Failed to import NetCDF XML to DB:')
        return expect(repo.find()).resolves.toHaveLength(1)
    })
})