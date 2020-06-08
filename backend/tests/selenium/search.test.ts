import {Key, By, until, WebDriver} from 'selenium-webdriver'
import axios from 'axios'
import {
  wait,
  backendPrivateUrl,
  visualizationPayloads, putFile
} from '../lib'
import {Selenium, initDriver} from '../lib/selenium'
import { basename } from 'path'

let selenium: Selenium
let driver: WebDriver

jest.setTimeout(60000)

async function initSearch() {
  await selenium.driver.get('http://localhost:8000/search/data')
  await selenium.sendInputToMultiselect('siteSelect', 'bucharest')
  return selenium.sendInput('dateTo', '2020-04-01')
}

async function sendInput(key: string, input: string) {
  const element = await findElement(By.name(key))
  await element.sendKeys(input)
  await selenium.clickTab()
  return wait(100)
}

async function sendInputToMultiselect(key: string, input: string) {
  await selenium.clickGrandparentById(key)
  await driver.actions().sendKeys(`${input}${Key.ENTER}`).perform()
  return wait(100)
}

async function clearMultiSelect(key: string) {
  await selenium.clickGrandparentById(key)
  await driver.actions().sendKeys(`${Key.BACK_SPACE}${Key.BACK_SPACE}${Key.BACK_SPACE}`).perform()
  return wait(100)
}

async function findElement(by: By) {
  await driver.wait(until.elementLocated(by))
  return driver.findElement(by)
}

async function selectAllSites() {
  await sendInputToMultiselect('siteSelect', 'bucharest')
  await sendInputToMultiselect('siteSelect', 'hyytiälä')
  await sendInputToMultiselect('siteSelect', 'mace head')
 }

async function clearkMapSelection(by: By) {
  const mapElement = await driver.wait(until.elementLocated(by))
  let actions = driver.actions({bridge: true})
  actions.move({origin: mapElement, x: 68, y: 78})
  actions.click().perform()
  actions.clear()
}

async function clickMapMarker(by: By, x: number, y: number) {
  const mapElement = await driver.wait(until.elementLocated(by))
  let actions = driver.actions({bridge: true})
  actions.move({origin: mapElement, x: x, y: y})
  actions.click().perform()
  actions.clear()
}

async function getMarkerSrc(by: By) {
  const mapElement = await driver.wait(until.elementLocated(by))
  const x = mapElement.findElement(By.className('leaflet-marker-pane'))
  const marker = x.findElement(By.className('leaflet-marker-icon'))
  return marker.getAttribute('src')
}

async function clickAllMarkers(by: By) {
  await clickMapMarker(by, 55, -113) // Hyytiälä
  await clickMapMarker(by, 68, 78) //Bucharest
  await clickMapMarker(by, -140, -20) // Mace Head
}

beforeAll(async () => {
  driver = await initDriver()
  selenium = new Selenium(driver)
})

afterAll(async () => {
  await wait(3000)
  return driver.close()
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
    filenames.push('20200501_bucharest_classification.nc')

    // PUT files
    for (let i=0; i < filenames.length; i++) {
      await putFile(filenames[i])
    }

    // PUT visualizations
    const vizUrl = `${backendPrivateUrl}visualization/`
    return Promise.all([
      axios.put(`${vizUrl}${basename(visualizationPayloads[0].fullPath)}`, visualizationPayloads[0]),
      axios.put(`${vizUrl}${basename(visualizationPayloads[1].fullPath)}`, visualizationPayloads[1]),
    ])
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
    expect(content).toContain('Found 1 results')
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
    await wait(300)
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

  it('switches to visualization search', async () => {
    await selenium.sendInput('dateTo', '2020-05-01')
    await selenium.clickClass('secondaryButton')
    const content = await selenium.getContent()
    expect((await selenium.findAllByClass('sourceFile')).length).toEqual(1)
    expect((await selenium.findAllByClass('variable')).length).toEqual(2)
  })

  it('select site from multi-selection while clicking marker', async () => {
    await clearkMapSelection(By.id('map'))
    await clickMapMarker(By.id('map'), -140, -20)
    const content = await selenium.getContent()
    expect(content).toContain('Mace Head')
  })

  it('remove site from multi-selection while clicking marker twice', async () => {
    await clearkMapSelection(By.id('map'))
    await clickMapMarker(By.id('map'), -140, -20)
    await clickMapMarker(By.id('map'), -140, -20)
    const content = await selenium.getContent()
    expect(content).not.toContain('Mace Head')
  })

  it('change marker color by clicking marker', async () => {
    await clearkMapSelection(By.id('map'))
    const src1 = getMarkerSrc(By.id('map'))
    const s1 = (await src1).anchor('src')
    await clickAllMarkers(By.id('map'))
    const src2 = getMarkerSrc(By.id('map'))
    const s2 = (await src2).anchor('src')
    expect(s1).not.toEqual(s2)
  })

  it('change marker color by doupleclicking marker', async () => {
    await clearkMapSelection(By.id('map'))
    const src1 = getMarkerSrc(By.id('map'))
    const s1 = (await src1).anchor('src')
    await clickAllMarkers(By.id('map'))
    await clickAllMarkers(By.id('map'))
    const src2 = getMarkerSrc(By.id('map'))
    const s2 = (await src2).anchor('src')
    expect(s1).toEqual(s2)
  })

  it('change marker color by clicking site from multi-selection', async () => {
    await clearkMapSelection(By.id('map'))
    const src1 = getMarkerSrc(By.id('map'))
    const s1 = (await src1).anchor('src')
    await selectAllSites()
    const src2 = getMarkerSrc(By.id('map'))
    const s2 = (await src2).anchor('src')
    expect(s1).not.toEqual(s2)
  })

  it('change marker color by removing site from multi-selection', async () => {
    await clearkMapSelection(By.id('map'))
    const src1 = getMarkerSrc(By.id('map'))
    const s1 = (await src1).anchor('src')
    await selectAllSites()
    await clearMultiSelect('siteSelect')
    const src2 = getMarkerSrc(By.id('map'))
    const s2 = (await src2).anchor('src')
    expect(s1).toEqual(s2)
  })

})
