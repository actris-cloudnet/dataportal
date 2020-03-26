import { parseStringPromise } from 'xml2js'
import { readFileSync, createReadStream } from 'fs'
import { promises as fsp }  from 'fs'
import { basename, join, resolve as pathResolve } from 'path'
import { createHash } from 'crypto'
import 'reflect-metadata'
import { createConnection, Connection } from 'typeorm'
import { File } from './entity/File'
import { Site } from './entity/Site'
import { isNetCDFObject, getMissingFields, NetCDFObject } from './entity/NetCDFObject'
import { spawn } from 'child_process'
import { stringify } from './lib'
import config from '../config'

const connName = config.connectionName
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

const checkSiteExists = (conn: Connection, site: string): Promise<Site> =>
  conn.getRepository(Site).findOneOrFail(site.toLowerCase().replace(/\W/g, ''))

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

function linkFile(filename: string) {
  const linkPath = config.publicDir
  return fsp.symlink(pathResolve(filename), join(linkPath, basename(filename)))
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

async function parseXmlFromStdin(): Promise<NetCDFObject> {
  const xml: string = readFileSync(0, 'utf-8')

  const { netcdf }: NetCDFXML = await parseStringPromise(xml)
  filename = netcdf['$'].location
  const ncObj: any = netcdf.attribute
    .map((a) => a['$'])
    .map(({ name, value }) => ({ [name]: value }))
    .reduce((acc, cur) => Object.assign(acc, cur))

  if (!isNetCDFObject(ncObj)) {
    const missingFields = getMissingFields(ncObj)
    throw TypeError(`
        Invalid header fields\n
        Missing or invalid: ${stringify(missingFields)}\n
        ${stringify(ncObj)}`)
  }

  return ncObj
}

(async function() {
  let connection = await createConnection(connName)

  parseXmlFromStdin()
    .then((ncObj) =>
      Promise.all([
        ncObj,
        basename(filename),
        computeFileChecksum(filename),
        computeFileSize(filename),
        getFileFormat(filename),
        checkSiteExists(connection, ncObj.location),
        linkFile(filename)
      ])
    )
    .then(([ncObj, baseFilename, chksum, {size}, format, site]) => {
      const file = new File(ncObj, baseFilename, chksum, size, format, site)
      return connection.manager.save(file)
    })
    .catch(err => console.error('Failed to import NetCDF XML to DB: ', filename, '\n', err))
    .finally(() => connection.close())
})()
