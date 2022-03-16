const express = require('express')

// Storage-service
let serverMemory = {}
const storageApp = express()

storageApp.put('/*', (req, res, _next) =>{
  const path = req.params[0]
  console.log('PUT', path)
  serverMemory[path] = new Buffer(0)
  req.on('data', chunk => {
    const chunkStr = chunk.toString()
    if (chunkStr === 'invalidhash') return res.status(400).send('Checksum does not match file contents')
    if (chunkStr === 'servererr') return res.sendStatus(400)
    serverMemory[path] = Buffer.concat([serverMemory[path], chunk])
    if (chunkStr === 'content') return res.status(201).send({size: chunk.length})
  })
  req.on('error', console.error)
  req.on('end', () => res.headersSent || res.status(201).send({size: serverMemory[path].length}))
})

storageApp.get('/*', (req, res, _next) =>{
  const path = req.params[0]
  if (!(path in serverMemory)) return res.sendStatus(404)
  res.send(serverMemory[path])
})

storageApp.delete('/', (req, res, _next) =>{
  serverMemory = {}
  res.sendStatus(200)
})

storageApp.listen(5920, () => console.log('Storage service mock running'))

// PID-service
const validRequest = {
  type: 'collection',
  uuid: '48092c00-161d-4ca2-a29d-628cf8e960f6'
}
const response = {pid: 'testpid'}

const pidApp = express()
pidApp.post('/pid', express.json(), (req, res, _next) =>{
  if (req.body.type != validRequest.type || req.body.uuid != validRequest.uuid) return res.sendStatus(400)
  if (!req.body.wait) res.send(response)
})
pidApp.listen(5801, () => console.log('PID service mock running'))

// TODO citation-service
