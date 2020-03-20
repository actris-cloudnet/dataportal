import { By, until, WebDriver, Key } from 'selenium-webdriver'
import * as fs from 'fs'
import { join } from 'path'
import { inboxDir, prepareSelenium } from '../lib'

let driver: WebDriver

jest.setTimeout(30000)

async function initSearch() {
  await driver.get('http://localhost:8000/search')
  const siteSelect = await awaitAndFind(By.className('multiselect'))
  const dateFrom = await awaitAndFind(By.name('dateFrom'))
  const dateTo = await awaitAndFind(By.name('dateTo'))
  await siteSelect.click()
  await driver.actions().sendKeys(`bucharest${Key.ENTER}`).perform()
  return {'dateFrom': dateFrom, 'dateTo': dateTo}
}

async function awaitAndFind(by: By) {
  await driver.wait(until.elementLocated(by))
  return driver.findElement(by)
}

async function getContent() {
  return await (await awaitAndFind(By.tagName('html'))).getText()
}

beforeAll(async () => driver = await prepareSelenium())

afterAll(async () => {
  return driver.close()
})

describe('search page', () => {

  beforeAll(async () => {
    for (let i = 23; i <= 27; i++) {
      let fname = `201907${i}_bucharest_classification.nc`
      fs.copyFileSync(join('tests/data/', fname), join(inboxDir, fname))
    }
    await new Promise((resolve, _) => setTimeout(resolve, 3000))
  })

  it('should initially contain no files', async () => {
    await initSearch()
    const content = await getContent()
    expect(content).toContain('No results')
  })

  it('should contain all files with large date span', async () => {
    const inputs = await initSearch()
    await inputs['dateFrom'].sendKeys('2010')
    await driver.actions().sendKeys(Key.TAB).perform()
    const content = await getContent()
    expect(content).toContain('Found 5 results')
    expect(content).toContain('Classification file from Bucharest')
    for (let i = 23; i <= 27; i++) {
      expect(content).toContain(`2019-07-${i}`)
    }
  })

  it('should contain correct number of files after setting a date range', async () => {
    const inputs = await initSearch()
    await inputs['dateFrom'].sendKeys('2019-07-23')
    await driver.actions().sendKeys(Key.TAB).perform()
    await inputs['dateTo'].sendKeys('2019-07-26')
    await driver.actions().sendKeys(Key.TAB).perform()
    const content = await getContent()
    expect(content).toContain('Found 3 results')
    for (let i = 23; i <= 25; i++) {
      expect(content).toContain(`2019-07-${i}`)
    }
  })

  it('should forward to correct landing page after sorting and clicking certain row', async () => {
    const inputs = await initSearch()
    const sortIcon = await awaitAndFind(By.className('b-table-sort-icon-left'))
    await inputs['dateFrom'].sendKeys('2010')
    await driver.actions().sendKeys(Key.TAB).perform()
    await sortIcon.click()
    await driver.actions().sendKeys(Key.TAB).perform()
    driver.actions().click()
    const searchResult =  await awaitAndFind(By.xpath('//*[contains(text(), "2019-07-25")]'))
    await searchResult.click()
    expect(await driver.getCurrentUrl()).toContain('20c03d8f-c9c5-4cb1-8bf8-48d275d621ff')
    expect(await awaitAndFind(By.id('landing'))).toBeTruthy()
  })

  it ('should reset the search after pressing the reset button', async () => {
    const inputs = await initSearch()
    await inputs['dateFrom'].sendKeys('2010')
    await driver.actions().sendKeys(Key.TAB).perform()
    const resetButton = await awaitAndFind(By.id('reset'))
    await resetButton.click()
    const content = await getContent()
    expect(content).toContain('No results')
  })

})
