import { By, until, WebDriver, Key } from 'selenium-webdriver'
import * as fs from 'fs'
import { join } from 'path'
import { inboxDir, prepareSelenium, wait } from '../lib'

let driver: WebDriver

jest.setTimeout(30000)

const getContent = async () => await (await findElement(By.tagName('html'))).getText()
const clickTab = async () => await driver.actions().sendKeys(Key.TAB).perform()
const clickId = async (key: string) => await (await findElement(By.id(key))).click()
const clickClass = async (key: string) => await (await findElement(By.className(key))).click()
const clickXpath = async (key: string) => await (await findElement(By.xpath(key))).click()

async function initSearch() {
  await driver.get('http://localhost:8000/search')
  await clickClass('multiselect')
  await driver.actions().sendKeys(`bucharest${Key.ENTER}`).perform()
}

async function setDateFromPast() {
  await clickXpath('//html')
  const sequence = ['calendar', 'vc-title', 'vc-nav-title', 'vc-w-12', 'vc-w-12', 'day-1']
  for (let i=0; i < sequence.length; i++) {
    await clickClass(sequence[i])
  }
}

async function sendInput(key: string, input: string) {
  const element = await findElement(By.name(key))
  await element.sendKeys(input)
  await clickTab()
}

async function findElement(by: By) {
  await driver.wait(until.elementLocated(by))
  return driver.findElement(by)
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
    await wait(3000)
  })

  it('should initially contain no files', async () => {
    await initSearch()
    const content = await getContent()
    expect(content).toContain('No results')
  })

  it('should contain all files with large date span', async () => {
    await initSearch()
    await sendInput('dateFrom', '2010')
    const content = await getContent()
    expect(content).toContain('Found 5 results')
    expect(content).toContain('Classification file from Bucharest')
    for (let i = 23; i <= 27; i++) {
      expect(content).toContain(`2019-07-${i}`)
    }
  })

  it('should contain correct number of files after setting a date range', async () => {
    await initSearch()
    await sendInput('dateFrom', '2019-07-23')
    await sendInput('dateTo', '2019-07-26')
    const content = await getContent()
    expect(content).toContain('Found 3 results')
    for (let i = 23; i <= 25; i++) {
      expect(content).toContain(`2019-07-${i}`)
    }
  })

  it('should forward to correct landing page after sorting and clicking certain row', async () => {
    await initSearch()
    await sendInput('dateFrom', '2010')
    await clickClass('b-table-sort-icon-left')
    await clickTab()
    driver.actions().click()
    await clickXpath('//*[contains(text(), "2019-07-25")]')
    expect(await driver.getCurrentUrl()).toContain('20c03d8f-c9c5-4cb1-8bf8-48d275d621ff')
    expect(await findElement(By.id('landing'))).toBeTruthy()
  })

  it('should reset the search after clicking the reset button', async () => {
    await initSearch()
    await sendInput('dateFrom', '2010')
    await clickId('reset')
    await wait(1000)
    const content = await getContent()
    expect(content).toContain('No results')
  })

  it('should work when clicking the calendar', async () => {
    await initSearch()
    await setDateFromPast()
    const content = await getContent()
    expect(content).toContain('Found 5 results')
  })

  it('correct calendar input should override incorrect keyboard input', async () => {
    await initSearch()
    await sendInput('dateFrom', '2023')
    await setDateFromPast()
    const content = await getContent()
    expect(content).toContain('Found 5 results')
  })

})
