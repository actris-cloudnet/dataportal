import { backendPublicUrl, genResponse } from "../../lib";
import axios from "axios";
import { readResources } from "../../../../shared/lib";

const url = `${backendPublicUrl}sites/`;
let resources: any;
let sites: string[];

beforeAll(async () => {
  resources = await readResources();
  sites = resources["sites"].map((site: any) => site.id);
});

describe("GET /api/sites", () => {
  it("responds with a list of all sites in dev mode", async () => {
    const res = await axios.get(url, { params: { developer: "" } });
    expect(res.data).toHaveLength(sites.length);
    const siteList = res.data.map((d: any) => d.id);
    return sites.forEach((site) => expect(siteList).toContain(site));
  });

  it("responds with a list of all sites except test in normal mode", async () => {
    const expectedSites = sites.filter((site) => site != "granada");
    const res = await axios.get(url);
    expect(res.data).toHaveLength(expectedSites.length);
    const siteList = res.data.map((d: any) => d.id);
    return expectedSites.forEach((site) => expect(siteList).toContain(site));
  });

  it("responds with a list of all sites of given types", async () => {
    const params = { params: { type: ["campaign", "arm"] } };
    const res = await axios.get(url, params);
    expect(res.data).toHaveLength(2);
    expect(res.data[0].id).toEqual("newyork");
    expect(res.data[1].id).toEqual("shanghai");
  });

  it("does not show citations by default", async () => {
    const res = await axios.get(url);
    expect(res.data[0]).not.toHaveProperty("citations");
    expect(res.data[1]).not.toHaveProperty("citations");
  });

  it("responds with citations with showCitations flag", async () => {
    const params = { params: { showCitations: true } };
    const res = await axios.get(url, params);
    expect(res.data[0].citations).toMatchObject([
      {
        id: "bucharest_test",
        acknowledgements: "Bucharest test citation.",
      },
    ]);
    expect(res.data[1].citations).toMatchObject([
      {
        id: "hyytiala_test",
        acknowledgements: "Hyytiälä test citation.",
      },
    ]);
  });
});

describe("GET /api/sites/:siteid", () => {
  it("responds with the correct json on valid id", async () => {
    const validUrl = `${url}mace-head`;
    const res = await axios.get(validUrl);
    expect(res.data).toMatchObject(resources["sites"][1]);
  });

  it("responds with 404 if site is not found", async () => {
    const invalidUrl = `${url}espoo`;
    return expect(axios.get(invalidUrl)).rejects.toMatchObject(
      genResponse(404, { status: 404, errors: ["No sites match this id"] })
    );
  });
});
