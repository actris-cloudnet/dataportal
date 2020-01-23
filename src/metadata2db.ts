import { parseStringPromise } from 'xml2js'
import { readFileSync } from 'fs'
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

function obj2File(obj: any, filename: string): File {
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
    file.filepath = filename
    return file
}

async function readStdin() {
    const xml: string = await readFileSync(0, 'utf-8')

    const { netcdf }: NetCDFXML = await parseStringPromise(xml)
    const filename: string = netcdf['$'].location
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
    return obj2File(ncObj, filename)
}

Promise.all([
    readStdin(),
    createConnection()
]).then(([file, connection]) =>
    connection.manager.save(file).then(_ =>
        connection.close()
    )
).catch((err: Error) => console.error('Failed to import NetCDF XML to DB: ', err))