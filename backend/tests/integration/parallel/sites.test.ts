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
    expect(res.data[1].citations).toMatchObject([
      {
        id: "bucharest_test",
        acknowledgements: "Bucharest test citation.",
      },
    ]);
    expect(res.data[2].citations).toMatchObject([
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

describe("GET /api/sites/:siteid/locations", () => {
  it("responds with the correct json on valid id", async () => {
    const validUrl = `${url}boaty/locations`;
    const res = await axios.get(validUrl);
    expect(res.data).toMatchObject([
      {
        date: "2022-01-01",
        latitude: 60.163,
        longitude: 24.969,
      },
      {
        date: "2022-01-02",
        latitude: 59.801,
        longitude: 24.839,
      },
      {
        date: "2022-01-03",
        latitude: 59.446,
        longitude: 24.772,
      },
    ]);
  });

  it("responds with 404 if site is not found", async () => {
    const invalidUrl = `${url}espoo/locations`;
    return expect(axios.get(invalidUrl)).rejects.toMatchObject(
      genResponse(404, { status: 404, errors: ["No sites match this id"] })
    );
  });
});

describe("GET /api/sites/:siteid/locations/:date", () => {
  it("responds with the correct json on valid date", async () => {
    const validUrl = `${url}boaty/locations/2022-01-03`;
    const res = await axios.get(validUrl);
    expect(res.data).toMatchObject({
      date: "2022-01-03",
      latitude: 59.446,
      longitude: 24.772,
    });
  });

  it("responds with 404 on missing date", async () => {
    const missingUrl = `${url}boaty/locations/2022-01-04`;
    return expect(axios.get(missingUrl)).rejects.toMatchObject(
      genResponse(404, { status: 404, errors: ["No location match this date"] })
    );
  });

  it("responds with 404 if site is not found", async () => {
    const invalidUrl = `${url}espoo/locations/2022-01-03`;
    return expect(axios.get(invalidUrl)).rejects.toMatchObject(
      genResponse(404, { status: 404, errors: ["No sites match this id"] })
    );
  });
});
