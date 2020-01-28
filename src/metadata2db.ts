import { parseStringPromise } from 'xml2js'
import { readFileSync, createReadStream, statSync } from 'fs'
import { createHash } from 'crypto'
import 'reflect-metadata'
import { createConnection } from 'typeorm'
import { File } from './entity/File'

interface NetCDFXML {
    netcdf: {
        attribute: Array<{
            '$': {
                name: string
                value: string
            }
        }>
        '$': { location: string }
    }

}

// Cloudnet NC file header specification
const ncObjectSpec: Array<string> = [
    'title',
    'location',
    'history',
    'cloudnet_file_type',
    'file_uuid',
    'Conventions',
    'year',
    'month',
    'day',
]

const getMissingFields = (obj: any): Array<string> =>
    ncObjectSpec.filter(field => typeof obj[field] !== 'string')

const stringify = (obj: any): string =>
    JSON.stringify(obj, null, 2)

function obj2File(obj: any, filename: string, chksum: string, filesize: number): File {
    const file = new File()
    file.date = new Date(
        parseInt(obj.year),
        parseInt(obj.month),
        parseInt(obj.day)
    )
    file.title = obj.title
    file.location = obj.location
    file.history = obj.history
    file.type = obj.cloudnet_file_type
    file.uuid = obj.file_uuid
    file.path = filename
    file.checksum = chksum
    file.size = filesize
    return file
}

async function computeFileChecksum(filename: string): Promise<string> {
    return new Promise((resolve, reject) => {
        try {
            const hash = createHash('sha256')
            const input = createReadStream(filename)
            input.on('readable', () => {
                const data = input.read()
                if (data)
                    hash.update(data)
                else {
                    const chksum = hash.digest('hex')
                    resolve(chksum)
                }
            })
        } catch(err) {
            reject(err)
        }
    })
}

async function computeFileSize(filename: string) {
    return await statSync(filename).size
}

async function parseXmlFromStdin(): Promise<[any, string]> {
    const xml: string = await readFileSync(0, 'utf-8')

    const { netcdf }: NetCDFXML = await parseStringPromise(xml)
    const filename = netcdf['$'].location
    const ncObj: any = netcdf.attribute
        .map((a) => a['$'])
        .map(({ name, value }) => ({ [name]: value }))
        .reduce((acc, cur) => Object.assign(acc, cur))

    const missingFields = getMissingFields(ncObj)
    if (missingFields.length > 0) {
        throw TypeError(`
        Invalid header fields at ${filename}:\n
        Missing or invalid: ${stringify(missingFields)}\n
        ${stringify(ncObj)}`)
    }

    return [ncObj, filename]
}

parseXmlFromStdin()
    .then(([ncObj, filename]) =>
        Promise.all([
            filename,
            computeFileChecksum(filename),
            computeFileSize(filename),
            createConnection(),
            ncObj
        ])
    )
    .then(([filename, chksum, filesize, connection, ncObj]) => {
        const file = obj2File(ncObj, filename, chksum, filesize)
        return connection.manager.save(file)
            .then(_ => connection.close())
    })
    .catch(err => console.error('Failed to import NetCDF XML to DB: ', err))