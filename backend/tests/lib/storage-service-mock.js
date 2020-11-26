const express = require('express')

let serverMemory = {}
const app = express()

app.put('/*', (req, res, _next) =>{
  const path = req.params[0]
  serverMemory[path] = new Buffer(0)
  req.on('data', chunk => {
    const chunkStr = chunk.toString()
    if (chunkStr === 'content') return res.status(201).send({size: chunk.length})
    if (chunkStr === 'invalidhash') return res.status(400).send('Checksum does not match file contents')
    if (chunkStr === 'servererr') return res.sendStatus(400)
    serverMemory[path] = Buffer.concat([serverMemory[path], chunk])
  })
  req.on('error', console.error)
  req.on('end', () => res.headersSent || res.sendStatus(201))
})

app.get('/*', (req, res, _next) =>{
  if (!(req.params[0] in serverMemory)) return res.sendStatus(404)
  res.send(serverMemory[req.params[0]])
})

app.delete('/', (req, res, _next) =>{
  serverMemory = {}
  res.sendStatus(200)
})

app.listen(5910, () => console.log('Storage service mock running'))
