import {Builder, By, until, WebDriver} from 'selenium-webdriver'
import * as fs from 'fs'
import { join } from 'path'
 
let driver: WebDriver
const inboxDir = '../backend/tests/data/inbox'
beforeAll(async () => {
  driver = await new Builder().forBrowser('firefox').build()
})

afterAll(async () => {
  return driver.close()
})

describe('file landing page', () =>{
  beforeAll(async () => {
    fs.copyFileSync('../backend/tests/data/20190723_bucharest_classification.nc', join(inboxDir, '20190723_bucharest_classification.nc'))
    return new Promise((resolve, _) => setTimeout(resolve, 3000))
  })

  it('should return 404 when the file is not found', async () => {
    await driver.get('http://localhost:8000/file/asd')
    until.elementLocated(By.id('error'))
    const errorEl = await driver.findElement(By.id('error')) 
    const errorText = await errorEl.getText()
    expect(errorText).toContain('404')
  })

})