#!node

var fs = require('fs')
var parseString = require('xml2js').parseString
var xml = fs.readFileSync(0, 'utf-8')

parseString(xml, function (err, result) {
  console.dir(result)
})
