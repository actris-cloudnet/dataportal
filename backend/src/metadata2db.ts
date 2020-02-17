import { parseStringPromise } from 'xml2js'
import { readFileSync, createReadStream, statSync } from 'fs'
import { promises as fsp }  from 'fs'
import { basename, join } from 'path'
import { createHash } from 'crypto'
import 'reflect-metadata'
import { createConnection } from 'typeorm'
import { File } from './entity/File'
import { isNetCDFObject, getMissingFields, NetCDFObject } from './entity/NetCDFObject'

const connName: string = process.env.NODE_ENV == 'test' ? 'test' : 'default'

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

const stringify = (obj: any): string =>
    JSON.stringify(obj, null, 2)

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

function computeFileSize(filename: string) {
    return fsp.stat(filename)
}

function linkFile(filename: string) {
    return fsp.symlink(filename, join('public', basename(filename)))
}

async function parseXmlFromStdin(): Promise<[NetCDFObject, string]> {
    const xml: string = readFileSync(0, 'utf-8')

    const { netcdf }: NetCDFXML = await parseStringPromise(xml)
    const filename = netcdf['$'].location
    const ncObj: any = netcdf.attribute
        .map((a) => a['$'])
        .map(({ name, value }) => ({ [name]: value }))
        .reduce((acc, cur) => Object.assign(acc, cur))

    if(!isNetCDFObject(ncObj)) {
        const missingFields = getMissingFields(ncObj)
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
            ncObj,
            basename(filename),
            computeFileChecksum(filename),
            computeFileSize(filename),
            createConnection(connName),
            linkFile(filename)
        ])
    )
    .then(([ncObj, baseFilename, chksum, {size}, connection]) => {
        const file = new File(ncObj, baseFilename, chksum, size)
        return connection.manager.save(file)
            .finally(() => connection.close())
    })
    .catch(err => console.error('Failed to import NetCDF XML to DB: ', err))