import { By, until, WebDriver } from "selenium-webdriver";
import axios from "axios";
import { putFile, frontendUrl } from "../lib";
import { initDriver } from "../lib/selenium";

let driver: WebDriver;

jest.setTimeout(10000);

async function awaitAndFind(by: By) {
  await driver.wait(until.elementLocated(by));
  return driver.findElement(by);
}

beforeAll(async () => {
  driver = await initDriver();

  await putFile("20190723_bucharest_classification.nc");
});

afterAll(async () => {
  return driver.close();
});

describe("file landing page", () => {
  it("returns 404 when the file is not found", async () => {
    await driver.get(`${frontendUrl}file/asd`);
    const errorEl = await awaitAndFind(By.id("error"));
    const errorText = await errorEl.getText();
    return expect(errorText).toContain("404");
  });

  it("contains correct information", async () => {
    const targetArray = [
      "2019-07-23",
      "Classification",
      "1.0.4",
      "20190723_bucharest_classification.nc",
      "b77b731aaae54f40... show full",
      123,
      "HDF5 (NetCDF4)",
      "Bucharest, Romania",
      "44.348",
      "26.029",
    ];
    await driver.get(`${frontendUrl}file/15506ea8d3574c7baf8c95dfcc34fc7d`);
    const content = await (await awaitAndFind(By.id("filelanding"))).getText();
    return Promise.all(targetArray.map((value) => expect(content).toContain(value)));
  });

  it("starts download when clicking download button", async () => {
    await driver.get(`${frontendUrl}file/15506ea8d3574c7baf8c95dfcc34fc7d`);
    const button = await awaitAndFind(By.className("download"));
    const downloadUrl = await button.getAttribute("href");
    const response = await axios.head(downloadUrl);
    expect(response.status).toBe(200);
    return expect(response.headers["content-length"]).toBe("123");
  });
});
