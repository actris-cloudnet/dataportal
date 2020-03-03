#!node

const createConnection = require('typeorm').createConnection
const Site = require('../build/entity/Site').Site
const readFileSync = require('fs').readFileSync

const sites = JSON.parse(readFileSync('codelists/sites.json').toString())
const connNames = process.env.NODE_ENV == 'production' ? ['production'] : ['default', 'test'];

// Insert sites to dev and test dbs
(function () {
  connNames.forEach(async connName => {
    const conn = await createConnection(connName)
    conn.getRepository(Site).save(sites)
      .finally(() => conn.close())
  })
}())
