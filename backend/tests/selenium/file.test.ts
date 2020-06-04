import { By, until, WebDriver } from 'selenium-webdriver'
import {basename} from 'path'
import axios from 'axios'
import {backendPrivateUrl, runNcdump, parseUuid, visualizationPayloads, wait, putFile} from '../lib'
import {initDriver, Selenium} from '../lib/selenium'

let selenium: Selenium
let driver: WebDriver

jest.setTimeout(60000)

async function awaitAndFind(by: By) {
  await driver.wait(until.elementLocated(by))
  return driver.findElement(by)
}

beforeAll(async () => {
  driver = await initDriver()
  selenium = new Selenium(driver)

  const vizUrl = `${backendPrivateUrl}visualization/`
  await putFile('20190723_bucharest_classification.nc')
  await putFile('20200501_bucharest_classification.nc')
  return Promise.all([
    axios.put(`${vizUrl}${basename(visualizationPayloads[0].fullPath)}`, visualizationPayloads[0]),
    axios.put(`${vizUrl}${basename(visualizationPayloads[1].fullPath)}`, visualizationPayloads[1]),
  ])
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
    const content = await (await awaitAndFind(By.id('landing'))).getText()
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

  it('shows a preview image', async () => {
    await driver.get('http://localhost:8000/file/7a9c3894ef7e43d9aa7da3f25017acec')
    // Wait for page to load
    await wait(300)
    const imgs = await selenium.findAllByClass('visualization')
    expect(imgs.length).toEqual(1)
    const downloadUrl = await imgs[0].getAttribute('src')
    const response = await axios.head(downloadUrl)
    expect(response.status).toBe(200)
    return expect(response.headers['content-length']).toBe('91112')
  })

  it('shows all plots after clicking see more plots', async () => {
    await driver.get('http://localhost:8000/file/7a9c3894ef7e43d9aa7da3f25017acec')
    // Wait for page to load
    await wait(300)
    await selenium.clickClass('viewAllPlots')
    const imgs = await selenium.findAllByClass('visualization')
    expect(imgs.length).toEqual(2)
  })
})
