import { createReadStream, existsSync, unlinkSync } from 'fs'
import { promises as fsp }  from 'fs'
import { basename, join, resolve as pathResolve } from 'path'
import { createHash } from 'crypto'
import 'reflect-metadata'
import { Connection } from 'typeorm'
import { File } from './entity/File'
import { Site } from './entity/Site'
import { isNetCDFObject, getMissingFields, NetCDFObject } from './entity/NetCDFObject'
import { spawn } from 'child_process'
import { stringify } from './lib'
import config from './config'
import { Product } from './entity/Product'
import { release } from 'os'


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

const findVolatileFile = (conn: Connection, uuid: string): Promise<File|null> =>
  new Promise((resolve, reject) =>
    conn.getRepository(File).findOneOrFail(uuid, { relations: [ 'site' ]})
      .then(file => {
        if (!file.site.isTestSite && !file.volatile)
          reject('Cannot update a non-volatile file.')
        else
          resolve(file)
      })
      .catch(_ => resolve(null))
  )

const update = (file: File, connection: Connection) =>
  Promise.all([
    computeFileChecksum(filename),
    computeFileSize(filename),
    getFileFormat(filename)
  ]).then(([checksum, { size }, format]) => {
    const repo = connection.getRepository(File)
    return repo.save({ uuid: file.uuid, checksum, size, format, releasedAt: new Date() })
  })

const insert = (ncObj: NetCDFObject, connection: Connection) =>
  Promise.all([
    ncObj,
    basename(filename),
    computeFileChecksum(filename),
    computeFileSize(filename),
    getFileFormat(filename),
    checkSiteExists(connection, ncObj.location),
    checkProductExists(connection, ncObj.cloudnet_file_type),
    linkFile(filename)
  ]).then(([ncObj, baseFilename, chksum, { size }, format, site, product]) => {
    const file = new File(ncObj, baseFilename, chksum, size, format, site, product)
    file.releasedAt = new Date()
    return connection.manager.save(file)
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

function linkFile(filename: string) {
  const linkPath = config.publicDir
  const fullLink = join(linkPath, basename(filename))
  if (existsSync(fullLink)) unlinkSync(fullLink)
  return fsp.symlink(pathResolve(filename), fullLink)
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

function parseJSON(json: any) {
  const { netcdf }: NetCDFXML = json
  filename = netcdf['$'].location
  if (!existsSync(filename)) throw ('Missing file')
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

export async function putRecord(connection: Connection, input: any) {
  const ncObj = parseJSON(input)
  const existingFile = await findVolatileFile(connection, ncObj.file_uuid)
  if (existingFile) {
    return {
      body: await update(existingFile, connection),
      status: 200
    }
  } else {
    return {
      body: await insert(ncObj, connection),
      status: 201
    }
  }
}

export async function freezeRecord(result: any, connection: Connection, pid: string, freeze: boolean) {
  if (freeze) {
    await connection
      .getRepository(File)
      .createQueryBuilder()
      .update()
      .set({ pid: pid, volatile: false})
      .where('uuid = :uuid', { uuid: result.body.uuid })
      .execute()
  }
  return result.status
}
