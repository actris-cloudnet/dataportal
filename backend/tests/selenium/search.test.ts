import {By, WebDriver} from 'selenium-webdriver'
import axios from 'axios'
import {wait, runNcdump, backendPrivateUrl, parseUuid, clearDir, inboxDir, publicDir, clearRepo} from '../lib'
import {Selenium, initDriver} from '../lib/selenium'

let selenium: Selenium
let driver: WebDriver

jest.setTimeout(60000)

async function initSearch() {
  await selenium.driver.get('http://localhost:8000/search/data')
  return selenium.sendInputToMultiselect('siteSelect', 'bucharest')
}

beforeAll(async () => {
  driver = await initDriver()
  selenium = new Selenium(driver)
})

afterAll(async () => driver.close())

describe('search page', () => {

  beforeAll(async () => {

    let filenames = []
    for (let i = 23; i <= 27; i++) {
      filenames.push(`201907${i}_bucharest_classification.nc`)
    }
    for (let i = 23; i <= 24; i++) {
      filenames.push(`201907${i}_mace-head_iwc-Z-T-method.nc`)
    }
    filenames.push('20200126_granada_ecmwf.nc')

    for (let i=0; i < filenames.length; i++) {
      const xml = await runNcdump(`tests/data/${filenames[i]}`)
      const uuid = await parseUuid(xml)
      const url = `${backendPrivateUrl}file/${uuid}`
      await axios.put(url, xml, {headers: { 'Content-Type': 'application/xml' }})
    }
    await wait(3000)
  })

  beforeEach(initSearch)

  it('initially contains no files', async () => {
    const content = await selenium.getContent()
    expect(content).toContain('No results')
  })

  it('contains all files with large date span', async () => {
    await selenium.sendInput('dateFrom', '2010')
    const content = await selenium.getContent()
    expect(content).toContain('Found 5 results')
    expect(content).toContain('Classification file from Bucharest')
    for (let i = 23; i <= 27; i++) {
      expect(content).toContain(`2019-07-${i}`)
    }
  })

  it('contains correct number of files after setting a date range', async () => {
    await selenium.sendInput('dateFrom', '2019-07-23')
    await selenium.sendInput('dateTo', '2019-07-26')
    const content = await selenium.getContent()
    expect(content).toContain('Found 4 results')
    for (let i = 23; i <= 26; i++) {
      expect(content).toContain(`2019-07-${i}`)
    }
  })

  it('forwards to correct landing page after sorting and clicking certain row', async () => {
    await selenium.sendInput('dateFrom', '2010')
    await selenium.clickClass('b-table-sort-icon-left')
    await selenium.clickTab()
    selenium.driver.actions().click()
    await selenium.clickXpath('//*[contains(text(), "2019-07-25")]')
    expect(await selenium.driver.getCurrentUrl()).toContain('20c03d8f-c9c5-4cb1-8bf8-48d275d621ff')
    expect(await selenium.findElement(By.id('landing'))).toBeTruthy()
  })

  it('resets the search after clicking the reset button', async () => {
    await selenium.sendInput('dateFrom', '2010')
    await selenium.clickId('reset')
    await wait(1000)
    const content = await selenium.getContent()
    expect(content).toContain('No results')
  })

  it('works when clicking the calendar', async () => {
    await selenium.setDateFromPast()
    const content = await selenium.getContent()
    expect(content).toContain('Found 5 results')
  })

  it('corrects calendar input override incorrect keyboard input', async () => {
    await selenium.sendInput('dateFrom', '2023')
    await selenium.setDateFromPast()
    const content = await selenium.getContent()
    expect(content).toContain('Found 5 results')
  })

  it('works with different site selectors', async () => {
    await selenium.sendInput('dateFrom', '1980')
    await selenium.sendInputToMultiselect('siteSelect', 'mace')
    const content = await selenium.getContent()
    expect(content).toContain('Found 7 results')
    expect(content).toContain('Classification file from Bucharest')
    expect(content).toContain('Ice water content file from Mace-Head')
  })

  it('works with different product selectors', async () => {
    await selenium.clearMultiSelect('siteSelect')
    await selenium.sendInput('dateFrom', '1980')
    await selenium.sendInputToMultiselect('productSelect', 'ice')
    const content = await selenium.getContent()
    expect(content).toContain('Found 2 results')
    expect(content).toContain('Ice water content file from Mace-Head')
  })

  it('preserves search state after visiting a landing page', async () => {
    await selenium.sendInput('dateFrom', '2010')
    await selenium.clickClass('b-table-sort-icon-left')
    await selenium.clickTab()
    await selenium.clickXpath('//*[contains(text(), "2019-07-25")]')
    await wait(100)
    await selenium.driver.navigate().back()
    await wait(100)
    const content = await selenium.getContent()
    expect(content).toContain('Found 5 results')
  })

  it('enables developer mode', async () => {
    await selenium.sendInputToMultiselect('siteSelect', 'iddqd')
    await selenium.sendInputToMultiselect('siteSelect', 'granada')
    const content = await selenium.getContent()
    expect(content).toContain('developer mode')
    expect(content).toContain('Model file from Granada')
  })

  it('disables developer mode', async () => {
    await selenium.clickId('disableDevMode')
    await selenium.sendInputToMultiselect('siteSelect', 'granada')
    const content = await selenium.getContent()
    expect(content).not.toContain('developer mode')
    expect(content).not.toContain('Model file from Granada')
  })

  it('starts download when clicking download button', async () => {
    await selenium.sendInput('dateFrom', '1980')
    const button = await selenium.awaitAndFind(By.className('download'))
    const downloadUrl = await button.getAttribute('href')
    const response = await axios.head(downloadUrl)
    expect(response.status).toBe(200)
  })

})
