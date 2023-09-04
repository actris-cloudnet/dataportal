/*
import { clearRepo, wait } from "./index";
import { Builder, By, Key, until, WebDriver } from "selenium-webdriver";

export async function initDriver() {
  await clearRepo("visualization");
  await clearRepo("model_visualization");
  await clearRepo("regular_file");
  await clearRepo("model_file");
  await clearRepo("search_file");
  return new Builder().forBrowser("firefox").usingServer("http://selenium:4444/wd/hub").build();
}

export class Selenium {
  driver: WebDriver;

  constructor(driver: WebDriver) {
    this.driver = driver;
  }

  getContent = async () => await (await this.findElement(By.tagName("html"))).getText();
  getContentBy = async (by: By) => await (await this.findElement(by)).getText();
  clickTab = async () => await this.driver.actions().sendKeys(Key.TAB).perform();
  getById = async (key: string) => await this.findElement(By.id(key));
  clickId = async (key: string) => (await this.getById(key)).click();
  clickGrandparentById = async (key: string) =>
    (await (await this.getById(key)).findElement(By.xpath("../.."))).click();
  clickClass = async (key: string) => await (await this.findElement(By.className(key))).click();
  clickXpath = async (key: string) => await (await this.findElement(By.xpath(key))).click();
  findAllByClass = async (key: string) => await this.driver.findElements(By.className(key));

  async awaitAndFind(by: By) {
    await this.driver.wait(until.elementLocated(by));
    return this.driver.findElement(by);
  }

  async setDateFromPast() {
    await this.clickXpath("//html");
    const sequence = ["calendar", "vc-title", "vc-nav-title", "vc-w-12", "vc-w-12", "day-1"];
    for (let i = 0; i < sequence.length; i++) {
      await wait(50);
      await this.clickClass(sequence[i]);
    }
  }

  async sendInput(key: string, input: string) {
    const element = await this.findElement(By.name(key));
    await element.sendKeys(input);
    await this.clickTab();
    return wait(100);
  }

  async sendInputToMultiselect(key: string, input: string) {
    await this.clickGrandparentById(key);
    await this.driver.actions().sendKeys(`${input}${Key.ENTER}`).perform();
    return wait(100);
  }

  async clearMultiSelect(key: string) {
    await this.clickGrandparentById(key);
    await this.driver.actions().sendKeys(`${Key.BACK_SPACE}${Key.BACK_SPACE}${Key.BACK_SPACE}`).perform();
    return wait(100);
  }

  async findElement(by: By) {
    await this.driver.wait(until.elementLocated(by));
    return this.driver.findElement(by);
  }
}
*/
