import { By, Key, WebDriver } from "selenium-webdriver";
import axios from "axios";
import { backendPrivateUrl, frontendUrl, putFile, storageServiceUrl, visualizationPayloads, wait } from "../lib";
import { initDriver, Selenium } from "../lib/selenium";
import { basename } from "path";

let selenium: Selenium;
let driver: WebDriver;

jest.setTimeout(10000);

async function initSearch() {
  await selenium.driver.get(`${frontendUrl}search/visualizations`);
  await selenium.sendInputToMultiselect("siteSelect", "bucharest");
  return selenium.sendInput("dateTo", "2020-05-01");
}

async function getDateToValue(by: By) {
  const dateTo = await driver.findElement(by);
  return dateTo.getAttribute("value");
}

async function generateDateNowString() {
  const dateNow = new Date();
  const dateString = dateNow.toString();
  return dateString.substr(4, 11);
}

async function pressLeftKey() {
  const key = Key;
  const actions = driver.actions({ async: true });
  await actions.keyDown(key.CONTROL).sendKeys(key.LEFT).perform();
  await wait(200);
  await actions.keyUp(key.CONTROL).sendKeys(key.LEFT);
  await actions.clear();
}

async function pressRightKey() {
  const key = Key;
  const actions = driver.actions({ async: true });
  await actions.keyDown(key.CONTROL).sendKeys(key.RIGHT).perform();
  await wait(200);
  await actions.keyUp(key.CONTROL).sendKeys(key.RIGHT);
  await actions.clear();
}

beforeAll(async () => {
  driver = await initDriver();
  selenium = new Selenium(driver);
  await driver.manage().window().setRect({ width: 1440, height: 2048, x: 0, y: 0 });

  await putFile("20200501_bucharest_classification.nc");
  await Promise.all([
    axios.put(`${storageServiceUrl}cloudnet-img/${basename(visualizationPayloads[0].s3key)}`, "content"),
    axios.put(`${storageServiceUrl}cloudnet-img/${basename(visualizationPayloads[1].s3key)}`, "content"),
  ]);
  return Promise.all([
    axios.put(
      `${backendPrivateUrl}visualizations/${basename(visualizationPayloads[0].s3key)}`,
      visualizationPayloads[0]
    ),
    axios.put(
      `${backendPrivateUrl}visualizations/${basename(visualizationPayloads[1].s3key)}`,
      visualizationPayloads[1]
    ),
  ]);
});

afterAll(async () => driver.close());

describe("visualizations page before input", () => {
  it("asks the user to make a selection", async () => {
    await selenium.driver.get(`${frontendUrl}search/visualizations`);
    await wait(300);
    const content = await selenium.getContent();
    expect(content).toContain("Please make a selection in the search filters to display visualizations.");
  });
});

describe("visualizations page", () => {
  beforeEach(initSearch);

  it("finds visualizations if they exist", async () => {
    await selenium.sendInput("dateTo", "2020-05-01");
    const content = await selenium.getContent();
    expect(content).not.toContain("No visualizations");
    expect((await selenium.findAllByClass("sourceFile")).length).toEqual(1);
    expect((await selenium.findAllByClass("variable")).length).toEqual(2);
    const vizs = await selenium.findAllByClass("visualization");
    expect(vizs.length).toEqual(2);
    return Promise.all(
      vizs.map(async (viz) => {
        const downloadUrl = await viz.getAttribute("src");
        const response = await axios.head(downloadUrl);
        expect(response.status).toBe(200);
        return expect(response.headers["content-type"]).toBe("image/png");
      })
    );
  });

  it("filtering by variable works", async () => {
    await selenium.sendInput("dateTo", "2020-05-01");
    await selenium.sendInputToMultiselect("variableSelect", "target");
    expect((await selenium.findAllByClass("variable")).length).toEqual(1);
  });

  it("filtering by product works", async () => {
    await selenium.sendInput("dateTo", "2020-05-01");
    expect((await selenium.findAllByClass("sourceFile")).length).toEqual(1);
    await selenium.sendInputToMultiselect("productSelect", "microwave");
    const content = await selenium.getContent();
    expect(content).toContain("No visualizations");
  });

  it("forwards to correct landing page after clicking source file header", async () => {
    await selenium.sendInput("dateTo", "2020-05-01");
    await selenium.clickClass("sourceFileLink");
    expect(await selenium.driver.getCurrentUrl()).toContain("7a9c3894-ef7e-43d9-aa7d-a3f25017acec");
    expect(await selenium.findElement(By.id("filelanding"))).toBeTruthy();
  });

  it("switches to data search", async () => {
    await selenium.sendInput("dateTo", "2020-05-01");
    // Wait for the multiselect select span to vanish
    await wait(200);
    await selenium.clickClass("secondaryButton");
    const content = await selenium.getContent();
    expect(content).toContain("Found 1 results");
    expect(content).toContain("Classification from Bucharest");
  });

  it("preserves search when switching between searches", async () => {
    await selenium.sendInput("dateTo", "2020-05-01");
    await selenium.sendInputToMultiselect("productSelect", "classification");
    await wait(200);
    await selenium.sendInputToMultiselect("variableSelect", "target");
    // Wait for the multiselect select span to vanish
    await wait(200);
    await selenium.clickClass("secondaryButton");
    await wait(500);
    await selenium.clickClass("secondaryButton");
    expect((await selenium.findAllByClass("variable")).length).toEqual(1);
  });

  it("selects previous day by clicking to left button", async () => {
    await selenium.sendInput("dateTo", "2020-05-02");
    await selenium.clickId("previousBtn");
    await wait(200);
    const dateTo = getDateToValue(By.id("dateTo"));
    expect(await dateTo).toContain("May 01 2020");
  });

  it("selects next day by clicking to right button", async () => {
    await selenium.sendInput("dateTo", "2020-05-02");
    await selenium.clickId("nextBtn");
    await wait(800);
    const dateTo = getDateToValue(By.id("dateTo"));
    expect(await dateTo).toContain("May 03 2020");
  });

  it("does nothing by clicking to left button if begining of history", async () => {
    await selenium.sendInput("dateTo", "1970-01-01");
    await wait(200);
    await selenium.clickId("previousBtn");
    await wait(200);
    const dateTo = getDateToValue(By.id("dateTo"));
    expect(await dateTo).toContain("Jan 01 1970");
  });

  it("does nothing by clicking to right button if current date", async () => {
    const dateNow = await generateDateNowString();
    await selenium.sendInput("dateTo", dateNow.toString());
    await wait(200);
    await selenium.clickId("nextBtn");
    await wait(200);
    const dateTo = getDateToValue(By.id("dateTo"));
    expect(await dateTo).toContain(dateNow);
  });

  it("selects previous day by pressing left key", async () => {
    await selenium.sendInput("dateTo", "2020-05-02");
    await wait(500);
    await pressLeftKey();
    await wait(500);
    const dateTo = getDateToValue(By.id("dateTo"));
    expect(await dateTo).toContain("May 01 2020");
  });

  it("selects next day by pressing right key", async () => {
    await selenium.sendInput("dateTo", "2020-05-02");
    await wait(200);
    await pressRightKey();
    await wait(200);
    const dateTo = getDateToValue(By.id("dateTo"));
    expect(await dateTo).toContain("May 03 2020");
  });

  it("does nothing by pressing left key if begining of history", async () => {
    await selenium.sendInput("dateTo", "1970-01-01");
    await wait(200);
    await pressLeftKey();
    await wait(200);
    const dateTo = getDateToValue(By.id("dateTo"));
    expect(await dateTo).toContain("Jan 01 1970");
  });

  it("does nothing by pressing right key if current date", async () => {
    const dateNow = await generateDateNowString();
    await selenium.sendInput("dateTo", dateNow.toString());
    await wait(200);
    await pressRightKey();
    await wait(200);
    const dateTo = getDateToValue(By.id("dateTo"));
    expect(await dateTo).toContain(dateNow);
  });
});

describe("file landing page", () => {
  it("shows a preview image", async () => {
    await driver.get(`${frontendUrl}file/7a9c3894ef7e43d9aa7da3f25017acec`);
    // Wait for page to load
    await wait(300);
    const imgs = await selenium.findAllByClass("visualization");
    expect(imgs.length).toEqual(1);
    const downloadUrl = await imgs[0].getAttribute("src");
    const response = await axios.head(downloadUrl);
    expect(response.status).toBe(200);
    return expect(response.headers["content-type"]).toBe("image/png");
  });

  it("shows all plots after clicking see more plots", async () => {
    await driver.get(`${frontendUrl}file/7a9c3894ef7e43d9aa7da3f25017acec`);
    // Wait for page to load
    await wait(300);
    await selenium.clickClass("viewAllPlots");
    const imgs = await selenium.findAllByClass("visualization");
    expect(imgs.length).toEqual(2);
  });
});
