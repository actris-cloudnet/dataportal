import {By, WebDriver} from 'selenium-webdriver'
import axios from 'axios'
import {
  wait,
  backendPrivateUrl,
  visualizationPayloads, putFile
} from '../lib'
import {Selenium, initDriver} from '../lib/selenium'
import {basename} from 'path'

let selenium: Selenium
let driver: WebDriver

jest.setTimeout(60000)

async function initSearch() {
  await selenium.driver.get('http://localhost:8000/search/visualizations')
  return selenium.sendInputToMultiselect('siteSelect', 'bucharest')
}

beforeAll(async () => {
  driver = await initDriver()
  selenium = new Selenium(driver)
})

afterAll(async () => driver.close())

describe('visualizations page', () => {

  beforeAll(async () => {
    await putFile('20200501_bucharest_classification.nc')
    return Promise.all([
      axios.put(`${backendPrivateUrl}visualization/${basename(visualizationPayloads[0].fullPath)}`, visualizationPayloads[0]),
      axios.put(`${backendPrivateUrl}visualization/${basename(visualizationPayloads[1].fullPath)}`, visualizationPayloads[1]),
    ])
  })

  beforeEach(initSearch)

  it('initially contains no visualizations', async () => {
    const content = await selenium.getContent()
    expect(content).toContain('No visualizations')
  })

  it('finds visualizations if they exist', async () => {
    await selenium.sendInput('dateTo', '2020-05-01')
    const content = await selenium.getContent()
    expect(content).not.toContain('No visualizations')
    expect((await selenium.findAllByClass('sourceFile')).length).toEqual(1)
    expect((await selenium.findAllByClass('variable')).length).toEqual(2)
    const vizs = await selenium.findAllByClass('visualization')
    expect(vizs.length).toEqual(2)
    return Promise.all(vizs.map(async viz => {
      const downloadUrl = await viz.getAttribute('src')
      const response = await axios.head(downloadUrl)
      expect(response.status).toBe(200)
      return expect(parseInt(response.headers['content-length'])).toBeGreaterThan(0)
    }))
  })

  it('filtering by variable works', async () => {
    await selenium.sendInput('dateTo', '2020-05-01')
    await selenium.sendInputToMultiselect('variableSelect', 'target')
    expect((await selenium.findAllByClass('variable')).length).toEqual(1)
  })

  it('filtering by product works', async () => {
    await selenium.sendInput('dateTo', '2020-05-01')
    expect((await selenium.findAllByClass('sourceFile')).length).toEqual(1)
    await selenium.sendInputToMultiselect('productSelect', 'microwave')
    const content = await selenium.getContent()
    expect(content).toContain('No visualizations')
  })

  it('forwards to correct landing page after clicking source file header', async () => {
    await selenium.sendInput('dateTo', '2020-05-01')
    await selenium.clickClass('sourceFileLink')
    expect(await selenium.driver.getCurrentUrl()).toContain('7a9c3894-ef7e-43d9-aa7d-a3f25017acec')
    expect(await selenium.findElement(By.id('landing'))).toBeTruthy()
  })

  it('switches to data search', async () => {
    await selenium.sendInput('dateTo', '2020-05-01')
    // Wait for the multiselect select span to vanish
    await wait(200)
    await selenium.clickClass('secondaryButton')
    const content = await selenium.getContent()
    expect(content).toContain('Found 1 results')
    expect(content).toContain('Classification file from Bucharest')
  })

  it('preserves search when switching between searches', async () => {
    await selenium.sendInput('dateTo', '2020-05-01')
    await selenium.sendInputToMultiselect('productSelect', 'classification')
    await wait(200)
    await selenium.sendInputToMultiselect('variableSelect', 'target')
    // Wait for the multiselect select span to vanish
    await wait(200)
    await selenium.clickClass('secondaryButton')
    await wait(500)
    await selenium.clickClass('secondaryButton')
    expect((await selenium.findAllByClass('variable')).length).toEqual(1)
  })
})
