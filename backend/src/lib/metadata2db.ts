import {createReadStream, promises as fsp} from 'fs'
import {basename} from 'path'
import {createHash} from 'crypto'
import 'reflect-metadata'
import {Connection} from 'typeorm'
import {File} from '../entity/File'
import {Site} from '../entity/Site'
import {getMissingFields, isNetCDFObject, NetCDFObject} from '../entity/NetCDFObject'
import {spawn} from 'child_process'
import {linkFile, stringify} from './index'
import config from '../config'
import {Product} from '../entity/Product'


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


export class ReceivedFile {

  readonly ncObj: NetCDFObject
  readonly filepath: string
  readonly conn: Connection
  readonly freeze: boolean

  constructor(json: any, conn: Connection, freeze: boolean) {
    const { netcdf }: NetCDFXML = json
    const ncObj: any = netcdf.attribute
      .map((a) => a['$'])
      .map(({ name, value }) => ({ [name]: value }))
      .reduce((acc, cur) => Object.assign(acc, cur))

    if (!isNetCDFObject(ncObj)) {
      const missingFields = getMissingFields(ncObj)
      throw [`Invalid header fields\n
            Missing or invalid: ${stringify(missingFields)}\n
            ${stringify(ncObj)}`]
    }

    if (freeze && !ncObj.pid) throw ['Tried to freeze a file with no PID']

    this.ncObj = ncObj
    this.filepath = netcdf['$'].location
    this.conn = conn
    this.freeze = freeze
  }

  getUuid() {
    return this.ncObj.file_uuid
  }

  async insertFile() {
    return Promise.all([
      basename(this.filepath),
      this.computeFileChecksum(),
      this.computeFileSize(),
      this.getFileFormat(),
      this.checkSiteExists(),
      this.checkProductExists(),
      linkFile(this.filepath, config.publicDir)
    ]).then(([baseFilename, chksum, { size }, format, site, product]) => {
      const file = new File(this.ncObj, baseFilename, chksum, size, format, site, product, !this.freeze)
      file.releasedAt = new Date()
      const repo = this.conn.getRepository(File)
      return repo.save(file)
    })
  }

  async updateFile() {
    return Promise.all([
      this.computeFileChecksum(),
      this.computeFileSize(),
      this.getFileFormat()
    ]).then(([checksum, { size }, format]) => {
      const repo = this.conn.getRepository(File)
      return repo.update({uuid: this.getUuid()},
        { checksum, size, format, releasedAt: new Date(), volatile: !this.freeze, pid: (this.ncObj.pid || '') })
    })
  }

  private checkSiteExists = (): Promise<Site> =>
    this.conn.getRepository(Site).findOneOrFail(this.ncObj.location.toLowerCase().replace(/\W/g, ''))

  private checkProductExists = (): Promise<Product> =>
    this.conn.getRepository(Product).findOneOrFail(this.ncObj.cloudnet_file_type)

  private async computeFileChecksum(): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const hash = createHash('sha256')
        const input = createReadStream(this.filepath)
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

  private computeFileSize() {
    return fsp.stat(this.filepath)
  }

  private getFileFormat(): Promise<string> {
    return new Promise((resolve, reject) => {
      const proc = spawn('file', [this.filepath])

      let out: string
      proc.stdout.on('data', data => out += data)
      proc.on('close', () => {
        if (out.includes('NetCDF Data Format data')) {
          resolve('NetCDF3')
        } else if (out.includes('Hierarchical Data Format (version 5) data')) {
          resolve('HDF5 (NetCDF4)')
        } else {
          reject(`Unknown file type ${out}`)
        }
      })
    })
  }
}
