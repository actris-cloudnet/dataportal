import {By, until, WebDriver} from 'selenium-webdriver'
import axios from 'axios'
import {putFile, wait} from '../lib'
import {initDriver, Selenium} from '../lib/selenium'

let selenium: Selenium
let driver: WebDriver


jest.setTimeout(60000)

async function initSearch() {
  await driver.get('http://localhost:8000/search/data')
  await selenium.sendInputToMultiselect('siteSelect', 'bucharest')
  return selenium.sendInput('dateTo', '2020-04-01')
}

async function selectAllSites() {
  await selenium.sendInputToMultiselect('siteSelect', 'bucharest')
  await selenium.sendInputToMultiselect('siteSelect', 'hyytiälä')
  await selenium.sendInputToMultiselect('siteSelect', 'mace head')
}

async function clearMapSelection(by: By) {
  const mapElement = await driver.wait(until.elementLocated(by))
  let actions = driver.actions({bridge: true})
  actions.move({origin: mapElement, x: 68, y: 78})
  await actions.click().perform()
  await actions.clear()
}

async function clickMapMarker(by: By, x: number, y: number) {
  const mapElement = await driver.wait(until.elementLocated(by))
  let actions = driver.actions({bridge: true})
  actions.move({origin: mapElement, x: x, y: y})
  await actions.click().perform()
  await actions.clear()
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
    driver.actions().click()
    await selenium.clickXpath('//*[contains(text(), "2019-07-25")]')
    expect(await driver.getCurrentUrl()).toContain('20c03d8f-c9c5-4cb1-8bf8-48d275d621ff')
    expect(await selenium.findElement(By.id('filelanding'))).toBeTruthy()
  })

  it('comes back from landing page when clicking the back button', async () => {
    await selenium.sendInput('dateFrom', '2010')
    await selenium.clickClass('b-table-sort-icon-left')
    await selenium.clickTab()
    driver.actions().click()
    await selenium.clickXpath('//*[contains(text(), "2019-07-25")]')
    expect(await driver.getCurrentUrl()).toContain('20c03d8f-c9c5-4cb1-8bf8-48d275d621ff')
    const backButton = await selenium.findElement(By.id('backButton'))
    expect(backButton).toBeTruthy()
    await backButton.click()
    expect(await driver.getCurrentUrl()).toContain('search/data')
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
    expect(content).toContain('Ice water content file from Mace Head')
  })

  it('works with different product selectors', async () => {
    await selenium.clearMultiSelect('siteSelect')
    await selenium.sendInput('dateFrom', '1980')
    await selenium.sendInputToMultiselect('productSelect', 'ice')
    const content = await selenium.getContent()
    await wait(300)
    expect(content).toContain('Found 2 results')
    expect(content).toContain('Ice water content file from Mace Head')
  })

  it('preserves search state after visiting a landing page', async () => {
    await selenium.sendInput('dateFrom', '2010')
    await selenium.clickClass('b-table-sort-icon-left')
    await selenium.clickTab()
    await selenium.clickXpath('//*[contains(text(), "2019-07-25")]')
    await wait(100)
    await driver.navigate().back()
    await wait(100)
    const content = await selenium.getContent()
    expect(content).toContain('Found 5 results')
  })

  it('enables developer mode', async () => {
    await selenium.sendInputToMultiselect('siteSelect', 'iddqd')
    await selenium.sendInputToMultiselect('siteSelect', 'granada')
    await selenium.sendInput('dateFrom', '1980')
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

  it('starts download from collection page', async () => {
    await selenium.sendInput('dateFrom', '1980')
    const button = await selenium.awaitAndFind(By.className('download'))
    await button.click()
    await wait(200)
    expect(await driver.getCurrentUrl()).toContain('collection')
    const downloadButton = await selenium.awaitAndFind(By.id('downloadCollection'))
    const downloadUrl = await downloadButton.getAttribute('href')
    const response = await axios.head(downloadUrl)
    expect(response.status).toBe(200)
  })

  it('selects site from multi-selection while clicking marker', async () => {
    await wait(500)
    await clearMapSelection(By.id('mapContainer'))
    await wait(500)
    await clickMapMarker(By.id('mapContainer'), -140, -20)
    await wait(500)
    const content = await selenium.getContent()
    expect(content).toContain('Mace Head')
  })

  it('displays clickable markers of additional sites after clicking show all sites checkbox', async () => {
    await clearMapSelection(By.id('mapContainer'))
    await selenium.clickId('showAllSitesCheckbox')
    await wait(500)
    await clickMapMarker(By.id('mapContainer'), -250, 20)
    await wait(500)
    const content = await selenium.getContent()
    expect(content).toContain('New York')
    await selenium.clickId('showAllSitesCheckbox')
  })

  it('removes site from multi-selection while clicking marker twice', async () => {
    await clearMapSelection(By.id('mapContainer'))
    await clickMapMarker(By.id('mapContainer'), -140, -20)
    await clickMapMarker(By.id('mapContainer'), -140, -20)
    const content = await selenium.getContent()
    expect(content).not.toContain('Mace Head')
  })

  it('changes marker color by clicking marker', async () => {
    await clearMapSelection(By.id('mapContainer'))
    const src1 = getMarkerSrc(By.id('mapContainer'))
    const s1 = (await src1).anchor('src')
    await clickAllMarkers(By.id('mapContainer'))
    const src2 = getMarkerSrc(By.id('mapContainer'))
    const s2 = (await src2).anchor('src')
    expect(s1).not.toEqual(s2)
  })

  it('changes marker color by doupleclicking marker', async () => {
    await clearMapSelection(By.id('mapContainer'))
    const src1 = getMarkerSrc(By.id('mapContainer'))
    const s1 = (await src1).anchor('src')
    await clickAllMarkers(By.id('mapContainer'))
    await clickAllMarkers(By.id('mapContainer'))
    const src2 = getMarkerSrc(By.id('mapContainer'))
    const s2 = (await src2).anchor('src')
    expect(s1).toEqual(s2)
  })

  it('changes marker color by clicking site from multi-selection', async () => {
    await clearMapSelection(By.id('mapContainer'))
    const src1 = getMarkerSrc(By.id('mapContainer'))
    const s1 = (await src1).anchor('src')
    await selectAllSites()
    const src2 = getMarkerSrc(By.id('mapContainer'))
    const s2 = (await src2).anchor('src')
    expect(s1).not.toEqual(s2)
  })

  it('changes marker color by removing site from multi-selection', async () => {
    await clearMapSelection(By.id('mapContainer'))
    const src1 = getMarkerSrc(By.id('mapContainer'))
    const s1 = (await src1).anchor('src')
    await selectAllSites()
    await selenium.clearMultiSelect('siteSelect')
    const src2 = getMarkerSrc(By.id('mapContainer'))
    const s2 = (await src2).anchor('src')
    expect(s1).toEqual(s2)
  })
})
