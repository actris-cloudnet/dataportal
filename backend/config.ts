interface Config {
  connectionName: string
  publicDir: string
}

const testConfig = {
  connectionName: 'test',
  publicDir: 'tests/data/public'
}

const devConfig = {
  connectionName: 'default',
  publicDir: 'public'
}

let config: Config

switch (process.env.NODE_ENV) {
case 'production':
  try {
    config = require('config.prod.ts')
  } catch (ex) {
    console.error('WARN: Production config not found, using dev config instead.')
    config = devConfig
  }
  break
case 'test':
  config = testConfig
  break
default:
  config = devConfig
  break
}

export default config
