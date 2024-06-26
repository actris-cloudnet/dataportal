/*
import { By, until, WebDriver } from "selenium-webdriver";
import axios from "axios";
import { frontendUrl, putFile, wait } from "../lib";
import { initDriver, Selenium } from "../lib/selenium";

let selenium: Selenium;
let driver: WebDriver;

jest.setTimeout(10000);

const timeout_short = 100;
const timeout_long = 200;

beforeAll(async () => {
  driver = await initDriver();
  selenium = new Selenium(driver);
  await driver.manage().window().setRect({ width: 1440, height: 1440, x: 0, y: 0 });
});

afterAll(async () => driver.close());

describe("search page", () => {
  beforeAll(async () => {
    await putProductFiles();
    await putFile("20200126_granada_ecmwf.nc");
  });

  beforeEach(initSearch);

  it("initially contains no files", async () => {
    const content = await selenium.getContent();
    expect(content).toContain("No results");
  });

  it("contains all files with large date span", async () => {
    await selenium.sendInput("dateFrom", "2010");
    const content = await selenium.getContent();
    expect(content).toContain("Found 5 results");
    testBucharestFiles(content);
    const url = await selenium.driver.getCurrentUrl();
    expect(url).toMatch(`${frontendUrl}search/data?site=bucharest&dateFrom=2010-01-01`);
  });

  it("contains correct number of files after setting a date range", async () => {
    await selenium.sendInput("dateFrom", "2019-07-23");
    await selenium.sendInput("dateTo", "2019-07-26");
    const content = await selenium.getContent();
    expect(content).toContain("Found 4 results");
    for (let i = 23; i <= 26; i++) {
      expect(content).toContain(`2019-07-${i}`);
    }
    const url = await selenium.driver.getCurrentUrl();
    expect(url).toMatch(`${frontendUrl}search/data?site=bucharest&dateFrom=2019-07-23&dateTo=2019-07-26`);
  });

  it("forwards to correct landing page after sorting and clicking certain row", async () => {
    await selenium.sendInput("dateFrom", "2010");
    await selenium.clickClass("b-table-sort-icon-left");
    await selenium.clickTab();
    driver.actions().click();
    await selenium.clickXpath('//*[contains(text(), "2019-07-25")]');
    await wait(timeout_short);
    await selenium.clickXpath('//*[contains(text(), "Show file")]');
    expect(await driver.getCurrentUrl()).toContain("20c03d8f-c9c5-4cb1-8bf8-48d275d621ff");
    expect(await selenium.findElement(By.id("filelanding"))).toBeTruthy();
  });

  it("comes back from landing page when clicking the back button", async () => {
    await selenium.sendInput("dateFrom", "2010");
    await selenium.clickClass("b-table-sort-icon-left");
    await selenium.clickTab();
    driver.actions().click();
    await selenium.clickXpath('//*[contains(text(), "2019-07-25")]');
    await wait(timeout_short);
    await selenium.clickXpath('//*[contains(text(), "Show file")]');
    expect(await driver.getCurrentUrl()).toContain("20c03d8f-c9c5-4cb1-8bf8-48d275d621ff");
    const backButton = await selenium.findElement(By.id("backButton"));
    expect(backButton).toBeTruthy();
    await backButton.click();
    const url = await selenium.driver.getCurrentUrl();
    expect(url).toMatch(`${frontendUrl}search/data?site=bucharest&dateFrom=2010-01-01`);
  });

  it("resets the search after clicking the reset button", async () => {
    await selenium.sendInput("dateFrom", "2010");
    await selenium.clickId("reset");
    await wait(timeout_long);
    const content = await selenium.getContent();
    expect(content).toContain("No results");
  });

  it("works when clicking the calendar", async () => {
    await selenium.setDateFromPast();
    const content = await selenium.getContent();
    expect(content).toContain("Found 5 results");
  });

  it("corrects calendar input override incorrect keyboard input", async () => {
    await selenium.sendInput("dateFrom", "2023");
    await selenium.setDateFromPast();
    const content = await selenium.getContent();
    expect(content).toContain("Found 5 results");
  });

  it("works with different site selectors", async () => {
    await selenium.sendInput("dateFrom", "1980");
    await selenium.sendInputToMultiselect("siteSelect", "mace");
    const content = await selenium.getContent();
    expect(content).toContain("Found 7 results");
    testBucharestFiles(content);
    testMaceHeadFiles(content);
    const url = await selenium.driver.getCurrentUrl();
    expect(url).toMatch(`${frontendUrl}search/data?site=bucharest,mace-head&dateFrom=1980-01-01`);
  });

  it("works with different product selectors", async () => {
    await selenium.clearMultiSelect("siteSelect");
    await selenium.sendInput("dateFrom", "1980");
    await selenium.sendInputToMultiselect("productSelect", "ice");
    const content = await selenium.getContent();
    await wait(timeout_short);
    expect(content).toContain("Found 2 results");
    testMaceHeadFiles(content);
    const url = await selenium.driver.getCurrentUrl();
    expect(url).toMatch(`${frontendUrl}search/data?dateFrom=1980-01-01&product=iwc`);
  });

  it("preserves search state after visiting a landing page", async () => {
    await selenium.sendInput("dateFrom", "2010");
    await selenium.clickClass("b-table-sort-icon-left");
    await selenium.clickTab();
    await selenium.clickXpath('//*[contains(text(), "2019-07-25")]');
    await wait(timeout_short);
    await selenium.clickXpath('//*[contains(text(), "Show file")]');
    await wait(timeout_short);
    await driver.navigate().back();
    await wait(timeout_short);
    const content = await selenium.getContent();
    expect(content).toContain("Found 5 results");
  });

  it("enables developer mode", async () => {
    await selenium.sendInputToMultiselect("siteSelect", "iddqd");
    await selenium.sendInputToMultiselect("siteSelect", "granada");
    await selenium.sendInput("dateFrom", "1980");
    await wait(timeout_short);
    const content = await selenium.getContent();
    expect(content).toContain("developer mode");
    expect(content).toContain("Model from Granada");
  });

  it("disables developer mode", async () => {
    await selenium.clickId("disableDevMode");
    await selenium.sendInputToMultiselect("siteSelect", "granada");
    await wait(timeout_short);
    const content = await selenium.getContent();
    expect(content).not.toContain("developer mode");
    expect(content).not.toContain("Model from Granada");
  });

  it("starts download from collection page", async () => {
    await selenium.sendInput("dateFrom", "1980");
    const button = await selenium.awaitAndFind(By.className("download"));
    await button.click();
    await wait(timeout_short);
    expect(await driver.getCurrentUrl()).toContain("collection");
    const downloadButton = await selenium.awaitAndFind(By.id("downloadCollection"));
    const downloadUrl = await downloadButton.getAttribute("href");
    const response = await axios.head(downloadUrl);
    expect(response.status).toBe(200);
  });

  it("selects site from multi-selection while clicking marker", async () => {
    await wait(timeout_short);
    await clearMapSelection(By.id("mapContainer"));
    await wait(timeout_short);
    await clickMapMarker(By.id("mapContainer"), -140, -20);
    await wait(timeout_short);
    const content = await selenium.getContent();
    expect(content).toContain("Mace Head");
  });

  it("displays clickable markers of additional sites after clicking show all sites checkbox", async () => {
    await clearMapSelection(By.id("mapContainer"));
    await selenium.clickId("showAllSitesCheckbox");
    await wait(timeout_long);
    await clickMapMarker(By.id("mapContainer"), -250, -50);
    await wait(timeout_long);
    const content = await selenium.getContent();
    expect(content).toContain("New York");
    await selenium.clickId("showAllSitesCheckbox");
  });

  it("removes site from multi-selection while clicking marker twice", async () => {
    await wait(timeout_short);
    await clearMapSelection(By.id("mapContainer"));
    await wait(timeout_short);
    await clickMapMarker(By.id("mapContainer"), -140, -20);
    await wait(timeout_long);
    await clickMapMarker(By.id("mapContainer"), -105, -5);
    await wait(timeout_long);
    const content = await selenium.getContent();
    expect(content).not.toContain("Mace Head");
  });

  it("changes marker color by clicking marker", async () => {
    await wait(timeout_short);
    await clearMapSelection(By.id("mapContainer"));
    await wait(timeout_short);
    const src1 = getMarkerSrc(By.id("mapContainer"));
    const s1 = (await src1).anchor("src");
    await clickAllMarkers(By.id("mapContainer"));
    await wait(timeout_short);
    const src2 = getMarkerSrc(By.id("mapContainer"));
    const s2 = (await src2).anchor("src");
    await wait(timeout_short);
    expect(s1).not.toEqual(s2);
  });

  it("changes marker color by clicking site from multi-selection", async () => {
    await clearMapSelection(By.id("mapContainer"));
    const src1 = getMarkerSrc(By.id("mapContainer"));
    const s1 = (await src1).anchor("src");
    await selectAllSites();
    const src2 = getMarkerSrc(By.id("mapContainer"));
    const s2 = (await src2).anchor("src");
    expect(s1).not.toEqual(s2);
  });

  it("changes marker color by removing site from multi-selection", async () => {
    await clearMapSelection(By.id("mapContainer"));
    const src1 = getMarkerSrc(By.id("mapContainer"));
    const s1 = (await src1).anchor("src");
    await selectAllSites();
    await selenium.clearMultiSelect("siteSelect");
    const src2 = getMarkerSrc(By.id("mapContainer"));
    const s2 = (await src2).anchor("src");
    expect(s1).toEqual(s2);
  });
});

describe("search page with url parameters", () => {
  beforeAll(async () => {
    await putProductFiles();
  });

  it("contains correct number of files after setting dateFrom from the past", async () => {
    const query = "dateFrom=2010";
    await selenium.driver.get(`${frontendUrl}search/data?${query}`);
    const content = await selenium.getContent();
    expect(content).toContain("Found 8 results");
    const url = await selenium.driver.getCurrentUrl();
    expect(url).toMatch(`${frontendUrl}search/data?dateFrom=2010-01-01`);
  });

  it("contains correct files after setting dateFrom and dateTo", async () => {
    const query = "dateFrom=2010&dateTo=2020-04-01";
    await selenium.driver.get(`${frontendUrl}search/data?${query}`);
    const content = await selenium.getContent();
    expect(content).toContain("Found 7 results");
    testBucharestFiles(content);
    testMaceHeadFiles(content);
  });

  it("contains correct files after setting dateFrom and site", async () => {
    const query = "site=bucharest&dateFrom=2010-01-01";
    await selenium.driver.get(`${frontendUrl}search/data?${query}`);
    const content = await selenium.getContent();
    expect(content).toContain("Found 6 results");
    testBucharestFiles(content, true);
    expect(content).not.toContain("Mace Head");
  });

  it("contains correct files after setting dateFrom and multiple sites", async () => {
    const query = "site=bucharest,mace-head&dateFrom=2010-01-01";
    await selenium.driver.get(`${frontendUrl}search/data?${query}`);
    const content = await selenium.getContent();
    expect(content).toContain("Found 8 results");
    testBucharestFiles(content, true);
    testMaceHeadFiles(content);
  });

  it("contains correct files after setting dateFrom and product", async () => {
    const query = "dateFrom=1980&product=iwc";
    await selenium.driver.get(`${frontendUrl}search/data?${query}`);
    const content = await selenium.getContent();
    expect(content).toContain("Found 2 results");
    testMaceHeadFiles(content);
    expect(content).not.toContain("Classification");
  });

  it("contains correct files after querying experimental product", async () => {
    const query = "dateFrom=2022-03-09&product=l3-cf";
    await selenium.driver.get(`${frontendUrl}search/data?${query}`);
    const content = await selenium.getContent();
    expect(content).toContain("Found 1 results");
    expect(content).toContain("L3 Cloud fraction from Bucharest 2022-03-10");
  });

  it("contains correct files after querying experimental product and normal products", async () => {
    const query = "dateFrom=1980-03-09&product=l3-cf,iwc,&site=mace-head,bucharest";
    await selenium.driver.get(`${frontendUrl}search/data?${query}`);
    const content = await selenium.getContent();
    expect(content).toContain("Found 3 results");
    expect(content).toContain("L3 Cloud fraction from Bucharest 2022-03-10");
    testMaceHeadFiles(content);
  });

  it("contains correct files after removing experimental products", async () => {
    const query = "dateFrom=1980-03-09&product=l3-cf,iwc,&site=mace-head,bucharest";
    await selenium.driver.get(`${frontendUrl}search/data?${query}`);
    const ExperimentalCheckbox = await selenium.findElement(By.id("showExpProductsCheckbox"));
    expect(ExperimentalCheckbox).toBeTruthy();
    await ExperimentalCheckbox.click();
    const content = await selenium.getContent();
    expect(content).toContain("Found 2 results");
    expect(content).not.toContain("L3 Cloud fraction from Bucharest 2022-03-10");
    testMaceHeadFiles(content);
    const url = await selenium.driver.getCurrentUrl();
    expect(url).toMatch(`${frontendUrl}search/data?dateFrom=1980-03-09&product=iwc&site=mace-head,bucharest`);
  });
});

async function initSearch() {
  await driver.get(`${frontendUrl}search/data`);
  await selenium.sendInputToMultiselect("siteSelect", "bucharest");
  return selenium.sendInput("dateTo", "2020-04-01");
}

async function selectAllSites() {
  await selenium.sendInputToMultiselect("siteSelect", "bucharest");
  await selenium.sendInputToMultiselect("siteSelect", "hyytiälä");
  await selenium.sendInputToMultiselect("siteSelect", "mace head");
}

async function clearMapSelection(by: By) {
  const mapElement = await driver.wait(until.elementLocated(by));
  const actions = driver.actions({ bridge: true });
  actions.move({ origin: mapElement, x: 68, y: 78 });
  await actions.click().perform();
  await actions.clear();
}

async function getMarkerSrc(by: By) {
  const mapElement = await driver.wait(until.elementLocated(by));
  const x = mapElement.findElement(By.className("leaflet-marker-pane"));
  const marker = x.findElement(By.className("leaflet-marker-icon"));
  return marker.getAttribute("src");
}

async function clickAllMarkers(by: By) {
  await clickMapMarker(by, 55, -113); // Hyytiälä
  await clickMapMarker(by, 68, 78); //Bucharest
  await clickMapMarker(by, -140, -20); // Mace Head
}

async function clickMapMarker(by: By, x: number, y: number) {
  const mapElement = await driver.wait(until.elementLocated(by));
  const actions = driver.actions({ bridge: true });
  actions.move({ origin: mapElement, x: x, y: y });
  await actions.click().perform();
  await actions.clear();
}

async function putProductFiles() {
  const filenames = [];
  for (let i = 23; i <= 27; i++) {
    filenames.push(`201907${i}_bucharest_classification.nc`);
  }
  for (let i = 23; i <= 24; i++) {
    filenames.push(`201907${i}_mace-head_iwc-Z-T-method.nc`);
  }
  filenames.push("20200501_bucharest_classification.nc");
  for (const filename of filenames) {
    await putFile(filename);
  }
  await putFile("20220310_bucharest_l3-cf_downsampled_ecmwf.nc");
}

function testBucharestFiles(content: any, all: boolean = false) {
  for (let i = 23; i <= 27; i++) {
    expect(content).toContain(`Classification from Bucharest 2019-07-${i}`);
  }
  if (all) expect(content).toContain("Classification from Bucharest 2020-05-01");
}

function testMaceHeadFiles(content: any) {
  for (let i = 23; i <= 24; i++) {
    expect(content).toContain(`Ice water content from Mace Head 2019-07-${i}`);
  }
}
*/
