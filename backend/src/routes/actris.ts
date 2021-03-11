import {ModelFile, RegularFile} from '../entity/File'
import {augmentFile} from '../lib'
import {Request, RequestHandler, Response} from 'express'
import {Connection, Repository} from 'typeorm'

export class ActrisRoutes {

  constructor(conn: Connection) {
    this.fileRepo = conn.getRepository<RegularFile>('regular_file')
    this.modelFileRepo = conn.getRepository<ModelFile>('model_file')
  }

  readonly fileRepo: Repository<RegularFile>
  readonly modelFileRepo: Repository<ModelFile>

  actrisfile: RequestHandler = async (req: Request, res: Response, next) => {

    const getFileByUuid = (repo: Repository<RegularFile|ModelFile>, isModel: boolean|undefined) => {
      const qb = repo.createQueryBuilder('file')
        .leftJoinAndSelect('file.site', 'site')
        .leftJoinAndSelect('file.product', 'product')
        .leftJoinAndSelect('product.variables', 'variables')
      if (isModel) qb.leftJoinAndSelect('file.model', 'model')
      return qb.where('file.uuid = :uuid', req.params)
        .getOne()
    }

    this.findAnyFile(getFileByUuid)
      .then(file => {
        if (file == null) return next({ status: 404, errors: ['No files match this UUID'] })
        res.send(this.translateFile2Actris(file))
      })
      .catch(err => next(err))
  }


  createTitle(file: RegularFile|ModelFile) {
    return `${file.product.humanReadableName} file from ${file.site.humanReadableName} measured on ${file.measurementDate}.`
  }

  translateFile2Actris(origfile: RegularFile|ModelFile) {
    const file = augmentFile(origfile)
    const site = file.site
    return {
      'md_metadata': { // mandatory
        'file_identifier': file.filename,
        'language': 'en', // mandatory
        'hierarchy_level': 'dataset', // mandatory, fixed list ['attribute','attributeType','collectionHardware','collectionSession','dataset','series','nonGeographicDataset','dimensionGroup','feature','featureType','propertyType','fieldSession','software','service','model','tile']
        'datestamp': file.updatedAt, // mandatory
        'contact': [{ // mandatory
          'first_name': 'Ewan', // mandatory
          'last_name': 'O\'Connor', // mandatory
          'organisation_name': 'Finnish Meteorological Institute (FMI)', // mandatory
          'role_code': ['pointOfContact'], // mandatory, fixed list ['resourceProvider','custodian','owner,'user,'distributor,'originator,'pointOfContact,'principalInvestigator,'processor,'publisher,'author]
          'country': 'Finland', // mandatory
          'country_code': 'FI'
        }],
        'online_resource': { // mandatory
          'linkage': 'https://cloudnet.fmi.fi/' // mandatory
        }
      },
      'md_identification': { // mandatory
        'abstract': this.createTitle(origfile), // mandatory
        'title': this.createTitle(origfile), // mandatory
        'identifier': file.pid ? {
          'id': file.pid,
          'type': 'N/A'
        } : undefined, // optional
        'date': new Date(file.measurementDate), // mandatory
        'date_type': 'creation', // mandatory, fixed list ['publication', 'revision', 'creation'
        'contact': [{ // mandatory
          'first_name': 'Simo', // mandatory
          'last_name': 'Tukiainen', // mandatory
          'organisation_name': 'Finnish Meteorological Institute (FMI)', // mandatory
          'role_code': ['processor'], // mandatory, see fixed list in example above
          'country': 'Finland', // mandatory
          'country_code': 'FI'
        }],
        'online_resource': { // mandatory
          'linkage': `https://cloudnet.fmi.fi/file/${file.uuid}` // mandatory
        }
      },
      'md_constraints': { // mandatory
        'access_constraints': 'otherRestrictions', // mandatory
        'use_constraints': 'otherRestrictions', // mandatory
        'other_constraints': 'http://actris.nilu.no/Content/Documents/DataPolicy.pdf', // mandatory
      },
      'md_keywords': { // mandatory
        'keywords': ['FMI', 'ACTRIS', file.product.humanReadableName] // mandatory, limit on 60 character keyword
      },
      'md_data_identification': { // mandatory
        'language': 'en', // mandatory
        'topic_category': 'climatologyMeteorologyAtmosphere', // mandatory
        'description': 'time series of point measurements', // mandatory
        'station_identifier': 'INO' // mandatory, fixed list will be provided
      },
      'ex_geographic_bounding_box': { // mandatory
        'west_bound_longitude': site.longitude, // mandatory
        'east_bound_longitude': site.longitude, // mandatory
        'south_bound_latitude': site.latitude, // mandatory
        'north_bound_latitude': site.latitude // mandatory
      },
      'ex_temporal_extent': { // mandatory
        'time_period_begin': file.measurementDate, // mandatory
        'time_period_end': file.measurementDate // mandatory
      },
      'ex_vertical_extent': { // optional
        'minimum_value': null, // optional
        'maximum_value': null, // optional
        'unit_of_measure': 'm above sea level' // optional
      },
      'md_content_information': { // mandatory
        'attribute_descriptions': file.product.variables.map(variable => variable.id.replace(/[-_]/g, '.')), // mandatory, list of parameters
        'content_type': 'physicalMeasurement' // mandatory, fixed list ['image','thematicClassification','physicalMeasurement']
      },
      'md_distribution_information': { // mandatory
        'data_format': file.format, // mandatory
        'version_data_format': file.format, // mandatory
        'transfersize': file.size, // optional
        'dataset_url': file.downloadUrl.replace('http://localhost:3000', 'https://cloudnet.fmi.fi'), // mandatory
        'protocol': 'http', // mandatory, fixed list ['http','opendap']
        'description': 'Direct download of data file', // optional
        'function': 'download', // mandatory
        'restriction': {
          'set': false, // mandatory
        }
      },
      'md_actris_specific': { // mandatory
        'platform_type': 'surface_station', // mandatory ["surface_station", "simulation_chamber", "ballon"]
        'product_type': file.product.id == 'model' ? 'model' : 'observation', // mandatory ["model", "observation", "fundamental_parameter"]
        'matrix': 'cloud', // mandatory ["cloud", "gas", "particle", "met"]
        'sub_matrix': 'Unknown', // mandatory
        'instrument_type': [(file.product.level == '2') || (file.product.id == 'model') ? 'UNKNOWN' : file.product], // mandatory
        'program_affiliation': ['ACTRIS'], // mandatory, fixed list ['ACTRIS', 'AMAP', 'AMAP_public','EUSAAR','EMEP','ACTRIS_preliminary','GAW-WDCA','GAW-WDCRG','NOAA-ESRL']
        'legacy_data': false, // mandatory
        'data_level': file.product.level, // mandatory, fixed list [0, 1, 2, 3]
        'data_sublevel': null, // optional
        'data_product': 'near-realtime-data' // mandatory, need fixed list e.g. ['higher level data','quality assured data', 'near-realtime-data']
      },
      'dq_data_quality_information': { // optional
        'level': 'dataset', // optional, fixed list ['attribute', 'attributeType', 'collectionHardware', 'collectionSession', 'dataset', 'series', 'nonGeographicDataset', 'dimensionGroup', 'feature', 'featureType', 'propertyType', 'fieldSession', 'software', 'service', 'model', 'tile']
      },
    }
  }
  findAnyFile(searchFunc: (arg0: Repository<RegularFile|ModelFile>, arg1?: boolean) =>
    Promise<RegularFile|ModelFile|undefined>):
    Promise<RegularFile|ModelFile|undefined> {
    return Promise.all([
      searchFunc(this.fileRepo, false),
      searchFunc(this.modelFileRepo, true)
    ])
      .then(([file, modelFile]) => file ? file : modelFile)
  }
}
