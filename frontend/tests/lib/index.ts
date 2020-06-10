// Prevents window.matchMedia error, see https://stackoverflow.com/questions/39830580/jest-test-fails-typeerror-window-matchmedia-is-not-a-function
export function init() {
  return Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // deprecated
      removeListener: jest.fn(), // deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  })
}

export const allFiles = [
  {
    'pid': '',
    'uuid': 'bde7a35f-03aa-4bff-acfb-b4974ea9f217',
    'title': 'Classification file from Mace-Head',
    'measurementDate': '2018-06-09',
    'history': '2019-09-14 14:02:22 - classification file created\n2019-09-14 14:02:07 - categorize file created\n2019-09-14 14:01:28 - radar file created\n2019-09-14 14:01:47 - ceilometer file created',
    'publicity': 'public',
    'cloudnetpyVersion': '1.0.4',
    'releasedAt': '2020-04-01T14:45:00.493Z',
    'filename': '20180609_mace-head_classification.nc',
    'checksum': 'b3142dd3b179e8344b30a7c38d0280eab1d122b8683445006e7691fa88ed2c42',
    'size': 130744,
    'format': 'HDF5 (NetCDF4)',
    'site': {
      'id': 'macehead',
      'humanReadableName': 'Mace Head',
      'latitude': 53.326,
      'longitude': -9.9,
      'altitude': 16,
      'gaw': 'MHD',
      'country': 'Ireland'
    },
    'product': {
      'id': 'classification',
      'humanReadableName': 'Classification',
      'level': '2'
    },
    'volatile': true
  },
  {
    'pid': '',
    'uuid': '6cb32746-faf0-4057-9076-ed2e698dcf36',
    'title': 'Categorize file from Bucharest',
    'measurementDate': '2019-07-15',
    'history': '2019-09-16 11:10:33 - categorize file created\n2019-09-16 11:10:10 - radar file created\nLidar backscatter derived from raw values in arbitrary units: calibrated by user Ewan O\'Connor <ewan.oconnor@fmi.fi> on 17-Jul-2019.',
    'publicity': 'public',
    'cloudnetpyVersion': '1.0.4',
    'releasedAt': '2020-04-01T14:45:00.499Z',
    'filename': '20190715_bucharest_categorize.nc',
    'checksum': '43d86b26f642a0befdcd7088ff38caab00ea3d95933f4ccc430179b4a29b74d3',
    'size': 7127282,
    'format': 'HDF5 (NetCDF4)',
    'site': {
      'id': 'bucharest',
      'humanReadableName': 'Bucharest',
      'latitude': 44.348,
      'longitude': 26.029,
      'altitude': 93,
      'gaw': 'Unknown',
      'country': 'Romania'
    },
    'product': {
      'id': 'categorize',
      'humanReadableName': 'Categorize',
      'level': '1'
    }
  },
  {
    'pid': '',
    'uuid': 'd21d6a9b-6804-4465-a026-74ec429fe17d',
    'title': 'Radar file from Hyytiala',
    'measurementDate': '2019-09-01',
    'history': '2019-09-30 10:56:08 - radar file created',
    'publicity': 'public',
    'cloudnetpyVersion': '1.0.4',
    'releasedAt': '2020-04-01T14:45:00.501Z',
    'filename': '20190901_hyytiala_rpg-fmcw-94.nc',
    'checksum': '9e7c4d902494a254b80d873f13806fd0f01e83564a13a053d3902db98a372ad1',
    'size': 16027310,
    'format': 'HDF5 (NetCDF4)',
    'site': {
      'id': 'hyytiala',
      'humanReadableName': 'Hyytiälä',
      'latitude': 61.844,
      'longitude': 24.288,
      'altitude': 174,
      'gaw': 'SMR',
      'country': 'Finland'
    },
    'product': {
      'id': 'radar',
      'humanReadableName': 'Radar',
      'level': '1'
    }
  },
  {
    'pid': '',
    'uuid': 'a5d1d5af-3667-41bc-b952-e684f627d91c',
    'title': 'Model file from Mace-Head',
    'measurementDate': '2014-12-05',
    'history': '2020-02-17 09:19:16 - global attributes fixed using attribute_modifier 0.0.1\nSun Dec  7 07:35:16 GMT 2014 - NetCDF generated from original data by update_files.pl using cnmodel2nc on anvil2',
    'publicity': 'public',
    'cloudnetpyVersion': '{}',
    'releasedAt': '2020-04-01T14:45:00.503Z',
    'filename': '20141205_mace-head_ecmwf.nc',
    'checksum': '255bcd9deae26851992c3da6352844fb9443203c48ae4f4ad8f1aa50ef2ab26f',
    'size': 500452,
    'format': 'NetCDF3',
    'site': {
      'id': 'macehead',
      'humanReadableName': 'Mace Head',
      'latitude': 53.326,
      'longitude': -9.9,
      'altitude': 16,
      'gaw': 'MHD',
      'country': 'Ireland'
    },
    'product': {
      'id': 'model',
      'humanReadableName': 'Model',
      'level': '1'
    }
  },
  {
    'pid': '',
    'uuid': '38092c00-161d-4ca2-a29d-628cf8e960f6',
    'title': 'Radar file from Mace-Head',
    'measurementDate': '2018-11-15',
    'history': '2019-09-14 22:56:17 - radar file created',
    'publicity': 'public',
    'cloudnetpyVersion': '1.0.4',
    'releasedAt': '2020-04-01T14:45:00.504Z',
    'filename': '20181115_mace-head_mira.nc',
    'checksum': '298688b011a511f8f0e9353371cf73ee86f60c89b0e02c6931d8c05542c64cdb',
    'size': 12200657,
    'format': 'HDF5 (NetCDF4)',
    'site': {
      'id': 'macehead',
      'humanReadableName': 'Mace Head',
      'latitude': 53.326,
      'longitude': -9.9,
      'altitude': 16,
      'gaw': 'MHD',
      'country': 'Ireland'
    },
    'product': {
      'id': 'radar',
      'humanReadableName': 'Radar',
      'level': '1'
    }
  }
]

export const allSites = [
  {
    'id': 'bucharest',
    'humanReadableName': 'Bucharest',
    'latitude': 44.348,
    'longitude': 26.029,
    'altitude': 93,
    'gaw': 'Unknown',
    'country': 'Romania'
  },
  {
    'id': 'macehead',
    'humanReadableName': 'Mace Head',
    'latitude': 53.326,
    'longitude': -9.9,
    'altitude': 16,
    'gaw': 'Unknown',
    'country': 'Ireland'
  },
  {
    'id': 'hyytiala',
    'humanReadableName': 'Hyytiälä',
    'latitude': 61.844,
    'longitude': 24.288,
    'altitude': 174,
    'gaw': 'SMR',
    'country': 'Finland'
  }
]

export const allProducts = [
  {
    'id': 'categorize',
    'humanReadableName': 'Categorize',
    'level': '1',
    'variables': [
      {
        'id': 'test1',
        'humanReadableName': 'Auringonpaisteen määrä',
        'order': '1'
      },
      {
        'id': 'test2',
        'humanReadableName': 'Kaljanhimo',
        'order': '0'
      }
    ]
  },
  {
    'id': 'classification',
    'humanReadableName': 'Classification',
    'level': '2',
    'variables': [
      {
        'id': 'classification-target_classification',
        'humanReadableName': 'Target classification',
        'order': '0'
      },
      {
        'id': 'classification-detection_status',
        'humanReadableName': 'Classification detection status',
        'order': '1'
      }
    ]
  },
  {
    'id': 'radar',
    'humanReadableName': 'Radar',
    'level': '1',
    'variables': []
  },
  {
    'id': 'lwc',
    'humanReadableName': 'Liquid water content',
    'level': '2',
    'variables': []
  },
  {
    'id': 'iwc',
    'humanReadableName': 'Ice water content',
    'level': '2',
    'variables': []
  },
  {
    'id': 'model',
    'humanReadableName': 'Model',
    'level': '1',
    'variables': []
  },
  {
    'id': 'drizzle',
    'humanReadableName': 'Drizzle',
    'level': '2',
    'variables': []
  },
  {
    'id': 'mwr',
    'humanReadableName': 'Microwave radiometer',
    'level': '1',
    'variables': []
  },
  {
    'id': 'lidar',
    'humanReadableName': 'Lidar',
    'level': '1',
    'variables': []
  }
]

export const dateToISOString = (date: Date) => date.toISOString().substring(0,10)

export const tomorrow = () => new Date(new Date().setDate(new Date().getDate() + 1))
