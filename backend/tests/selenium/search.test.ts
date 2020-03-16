import { By, until, WebDriver, Key } from 'selenium-webdriver'
import * as fs from 'fs'
import { join } from 'path'
import { inboxDir, prepareSelenium } from '../lib'

let driver: WebDriver

jest.setTimeout(30000)

async function awaitAndFind(by: By) {
  await driver.wait(until.elementLocated(by))
  return driver.findElement(by)
}

beforeAll(async () => driver = await prepareSelenium())

afterAll(async () => {
  return driver.close()
})

describe('search page', () => {
  beforeAll(async () => {
    fs.copyFileSync('tests/data/20190723_bucharest_classification.nc', join(inboxDir, '20190723_bucharest_classification.nc'))
    await new Promise((resolve, _) => setTimeout(resolve, 3000))
    // Navigate to page and formulate a query
    await driver.get('http://localhost:8000/search')
    const location = await awaitAndFind(By.className('multiselect'))
    await location.click()
    await driver.actions().sendKeys('bucharest' + Key.ENTER).perform()
    const dateFrom = await awaitAndFind(By.name('dateFrom'))
    await driver.actions().sendKeys(Key.TAB).perform()
    await dateFrom.sendKeys('2019-08-23')
    await driver.actions().sendKeys(Key.TAB).perform()
  })

  it('should show correct information when searching for an inserted file', async () => {
    const content = await (await awaitAndFind(By.tagName('html'))).getText()
    expect(content).toContain('Found 1 results')
    expect(content).toContain('2019-08-23')
    expect(content).toContain('Classification file from Bucharest')
  })

  it('should forward to landing page when clicking on the search result', async () => {
    const searchResult =  await awaitAndFind(By.xpath('//*[contains(text(), "Classification file from Bucharest")]'))
    await searchResult.click()
    expect(await driver.getCurrentUrl()).toContain('15506ea8-d357-4c7b-af8c-95dfcc34fc7d')
    expect(await awaitAndFind(By.id('landing'))).toBeTruthy()
  })

})
