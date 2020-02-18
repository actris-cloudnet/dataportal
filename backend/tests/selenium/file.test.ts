import {Builder, By, until, WebDriver} from 'selenium-webdriver'
import * as fs from 'fs'
import { join } from 'path'
import axios from 'axios'
import { createConnection } from 'typeorm'
 
let driver: WebDriver
const inboxDir = 'tests/data/inbox'
const publicDir = 'tests/data/public'

jest.setTimeout(30000)

function clearDir(dir: string) {
  const files = fs.readdirSync(dir)
  for(const file of files) {
      fs.unlinkSync(join(dir, file))
  }
}

async function awaitAndFind(by: By) {
  await driver.wait(until.elementLocated(by))
  return driver.findElement(by)
}

beforeAll(async () => {
  clearDir(inboxDir)
  clearDir(publicDir)
  const conn = await createConnection('test')
  await conn.synchronize(true) // Clean db
  driver = await new Builder().forBrowser('firefox').build()
  return conn.close()
})

afterAll(async () => {
  return driver.close()
})

describe('file landing page', () => {
  beforeAll(async () => {
    fs.copyFileSync('tests/data/20190723_bucharest_classification.nc', join(inboxDir, '20190723_bucharest_classification.nc'))
    return new Promise((resolve, _) => setTimeout(resolve, 3000))
  })

  it('should return 404 when the file is not found', async () => {
    await driver.get('http://localhost:8000/file/asd')
    const errorEl = await awaitAndFind(By.id('error'))
    const errorText = await errorEl.getText()
    return expect(errorText).toContain('404')
  })

  it('should contain correct information', async () => {
    const targetArray = [
      "15506ea8-d357-4c7b-af8c-95dfcc34fc7d",
      "23.8.2019",
      "Bucharest",
      "Classification",
      "1.0.4",
      "20190723_bucharest_classification.nc",
      "b77b731aaae54f403aae6765ad1d20e1603b4454e2bc0d461aab4985a4a82ca4",
      139021,
      "HDF5 (NetCDF4)"
    ]
    await driver.get('http://localhost:8000/file/15506ea8d3574c7baf8c95dfcc34fc7d')
    const content = await (await awaitAndFind(By.id('landing'))).getText()
    targetArray.forEach(value => {
      expect(content).toContain(value)
    })
    return
  })

  it('should start download when clicking download button', async () => {
    await driver.get('http://localhost:8000/file/15506ea8d3574c7baf8c95dfcc34fc7d')
    await driver.wait(until.elementLocated(By.id('landing')))
    const button = await driver.findElement(By.className('download'))
    button.click()
    await driver.wait(until.urlContains('.nc'))
    const url = (await driver.getCurrentUrl())
    const response = await axios.head(url)
    expect(response.status).toBe(200)
    return expect(response.headers['Content-Length']).toBe(139021)

  })
})