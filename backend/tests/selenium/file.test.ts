import { By, until, WebDriver } from 'selenium-webdriver'
import axios from 'axios'
import {putFile} from '../lib'
import {initDriver} from '../lib/selenium'

let driver: WebDriver

jest.setTimeout(60000)

async function awaitAndFind(by: By) {
  await driver.wait(until.elementLocated(by))
  return driver.findElement(by)
}

beforeAll(async () => {
  driver = await initDriver()

  return putFile('20190723_bucharest_classification.nc')
})

afterAll(async () => driver.close())

describe('file landing page', () => {

  it('returns 404 when the file is not found', async () => {
    await driver.get('http://localhost:8000/file/asd')
    const errorEl = await awaitAndFind(By.id('error'))
    const errorText = await errorEl.getText()
    return expect(errorText).toContain('404')
  })

  it('contains correct information', async () => {
    const targetArray = [
      '2019-07-23',
      'Classification',
      '1.0.4',
      '20190723_bucharest_classification.nc',
      'b77b731aaae54f403aae6765ad1d20e1603b4454e2bc0d461aab4985a4a82ca4',
      139021,
      'HDF5 (NetCDF4)',
      'Bucharest, Romania',
      '44.348', '26.029'
    ]
    await driver.get('http://localhost:8000/file/15506ea8d3574c7baf8c95dfcc34fc7d')
    const content = await (await awaitAndFind(By.id('filelanding'))).getText()
    return Promise.all(targetArray.map(value =>
      expect(content).toContain(value)
    ))
  })

  it('starts download when clicking download button', async () => {
    await driver.get('http://localhost:8000/file/15506ea8d3574c7baf8c95dfcc34fc7d')
    const button = await awaitAndFind(By.className('download'))
    const downloadUrl = await button.getAttribute('href')
    const response = await axios.head(downloadUrl)
    expect(response.status).toBe(200)
    return expect(response.headers['content-length']).toBe('139021')
  })

})
