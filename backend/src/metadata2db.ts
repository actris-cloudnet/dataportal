import {createReadStream, promises as fsp} from 'fs'
import {basename} from 'path'
import {createHash} from 'crypto'
import 'reflect-metadata'
import {Connection} from 'typeorm'
import {File} from './entity/File'
import {Site} from './entity/Site'
import {getMissingFields, isNetCDFObject, NetCDFObject} from './entity/NetCDFObject'
import {spawn} from 'child_process'
import {linkFile, stringify} from './lib'
import config from './config'
import {Product} from './entity/Product'


let filename: string

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


export const updateFile = (file: File, freeze: boolean, connection: Connection) =>
  Promise.all([
    computeFileChecksum(filename),
    computeFileSize(filename),
    getFileFormat(filename)
  ]).then(([checksum, { size }, format]) => {
    const repo = connection.getRepository(File)
    return repo.update({uuid: file.uuid}, { checksum, size, format, releasedAt: new Date(), volatile: !freeze })
  })

export const insertFile = (ncObj: NetCDFObject, freeze: boolean, connection: Connection) =>
  Promise.all([
    ncObj,
    basename(filename),
    computeFileChecksum(filename),
    computeFileSize(filename),
    getFileFormat(filename),
    checkSiteExists(connection, ncObj.location),
    checkProductExists(connection, ncObj.cloudnet_file_type),
    linkFile(filename, config.publicDir)
  ]).then(([ncObj, baseFilename, chksum, { size }, format, site, product]) => {
    const file = new File(ncObj, baseFilename, chksum, size, format, site, product, !freeze)
    file.releasedAt = new Date()
    const repo = connection.getRepository(File)
    return repo.insert(file)
  })

const checkSiteExists = (conn: Connection, site: string): Promise<Site> =>
  conn.getRepository(Site).findOneOrFail(site.toLowerCase().replace(/\W/g, ''))

const checkProductExists = (conn: Connection, product: string): Promise<Product> =>
  conn.getRepository(Product).findOneOrFail(product)

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
    } catch (err) {
      reject(err)
    }
  })
}

function computeFileSize(filename: string) {
  return fsp.stat(filename)
}

function getFileFormat(filename: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn('file', [filename])

    let out: string
    proc.stdout.on('data', data => out += data)
    proc.on('close', () => {
      if (out.includes('NetCDF Data Format data')) {
        resolve('NetCDF3')
      } else if (out.includes('Hierarchical Data Format (version 5) data')) {
        resolve('HDF5 (NetCDF4)')
      } else {
        reject(`Unknown file type ${  out}`)
      }
    })
  })
}

export async function parseJSON(json: any): Promise<NetCDFObject> {
  const { netcdf }: NetCDFXML = json
  filename = netcdf['$'].location
  const ncObj: any = netcdf.attribute
    .map((a) => a['$'])
    .map(({ name, value }) => ({ [name]: value }))
    .reduce((acc, cur) => Object.assign(acc, cur))

  if (!isNetCDFObject(ncObj)) {
    const missingFields = getMissingFields(ncObj)
    throw (`Invalid header fields\n
          Missing or invalid: ${stringify(missingFields)}\n
          ${stringify(ncObj)}`)
  }
  return ncObj
}
