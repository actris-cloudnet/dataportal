import { promises as fsp } from 'fs'
import { join } from 'path'

export const readResources = async () => {
  const baseDir = join(__dirname, '../res')
  const dirList = await fsp.readdir(baseDir)
  return Promise.all(dirList.map(fname => fsp.readFile(join(baseDir, fname))))
    .then(fileContents => {
      const res: { [key: string]: any } = {}
      dirList.forEach((fname, i) => (res[fname.substring(0, fname.length - 5)] = JSON.parse(fileContents[i].toString())))
      return res
    })
}
