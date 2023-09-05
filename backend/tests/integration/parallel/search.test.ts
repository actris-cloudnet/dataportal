import "reflect-metadata";
import { backendPublicUrl, genResponse } from "../../lib";
import axios from "axios";
import { RequestError } from "../../../src/entity/RequestError";
import { readResources } from "../../../../shared/lib";
import { describe, expect, it, beforeAll } from "@jest/globals";

let responses: any;

beforeAll(async () => {
  responses = await readResources();
});

const expectedBody404: RequestError = {
  status: 404,
  errors: "Not found",
};

describe("/api/files", () => {
  const url = `${backendPublicUrl}files/`;

  it("responds with 400 if no query parameters are given", () => {
    const expectedBody: RequestError = {
      status: 400,
      errors: ["No search parameters given"],
    };
    return expect(axios.get(`${backendPublicUrl}files/`)).rejects.toMatchObject(
      genResponse(expectedBody.status, expectedBody),
    );
  });

  it("responds with 400 if invalid query parameters are given", () => {
    const payload = { params: { site: "mace-head", x: "", y: "kissa" } };
    const expectedBody: RequestError = {
      status: 400,
      errors: ["Unknown query parameters: x,y"],
    };
    return expect(axios.get(`${backendPublicUrl}files/`, payload)).rejects.toMatchObject(
      genResponse(expectedBody.status, expectedBody),
    );
  });

  it("responds with an array of 2 objects when searching for mace-head", async () => {
    const payload = { params: { site: "mace-head" } };
    const res = await axios.get(url, payload);
    expect(res).toHaveProperty("data");
    expect(res.data).toHaveLength(2);
    return expect(res.data.map((d: any) => d.site.id)).toEqual(["mace-head", "mace-head"]);
  });

  it("responds with an array of 2 objects when searching for mira", async () => {
    const payload = { params: { instrument: "mira" } };
    const res = await axios.get(url, payload);
    expect(res).toHaveProperty("data");
    expect(res.data).toHaveLength(2);
    return expect(res.data.map((d: any) => d.instrument.id)).toEqual(["mira", "mira"]);
  });

  it("responds with an array of 3 objects when searching for mace-head and hyytiala", async () => {
    const payload = { params: { site: ["mace-head", "hyytiala"] } };
    const res = await axios.get(url, payload);
    expect(res).toHaveProperty("data");
    expect(res.data).toHaveLength(3);
    return expect(new Set(res.data.map((d: any) => d.site.id))).toEqual(
      new Set(["mace-head", "mace-head", "hyytiala"]),
    );
  });

  it("responds with 404 if site was not found", () => {
    const payload = { params: { site: ["kilpikonna"] } };
    expectedBody404.errors = ["One or more of the specified sites were not found"];
    return expect(axios.get(url, payload)).rejects.toMatchObject(genResponse(expectedBody404.status, expectedBody404));
  });

  it("responds 404 if one of many sites was not found", () => {
    const payload = { params: { site: ["mace-head", "kilpikonna"] } };
    expectedBody404.errors = ["One or more of the specified sites were not found"];
    return expect(axios.get(url, payload)).rejects.toMatchObject(genResponse(expectedBody404.status, expectedBody404));
  });

  it("responds with an array of objects with dates between [ dateFrom, dateTo ], in descending order", async () => {
    const payload = { params: { dateFrom: "2018-06-09", dateTo: "2019-09-01" } };
    const res = await axios.get(url, payload);
    return expect(res.data.map((d: any) => d.measurementDate)).toEqual([
      "2019-09-01",
      "2019-07-16",
      "2019-07-16",
      "2019-07-15",
      "2018-11-15",
      "2018-06-09",
    ]);
  });

  it("responds with correct objects if product is specified", async () => {
    const payload = { params: { product: "radar" } };
    const res = await axios.get(url, payload);
    return expect(res.data.map((d: any) => d.product.id)).toEqual(["radar", "radar", "radar"]);
  });

  it("responds with correct objects if dateFrom, dateTo, site, and product are specified", async () => {
    const payload = {
      params: {
        dateFrom: "2018-06-09",
        dateTo: "2019-09-02",
        site: "mace-head",
        product: "classification",
      },
    };
    const res = await axios.get(url, payload);
    expect(res.data.map((d: any) => d.site.id)).toEqual(["mace-head"]);
    expect(res.data.map((d: any) => d.product.id)).toEqual(["classification"]);
    return expect(res.data.map((d: any) => d.measurementDate)).toEqual(["2018-06-09"]);
  });

  it("responds with 400 on malformed dateFrom", () => {
    const expectedBody: RequestError = {
      status: 400,
      errors: ['Malformed date in property "dateFrom"'],
    };
    const payload1 = { params: { dateFrom: "turku" } };
    return expect(axios.get(url, payload1)).rejects.toMatchObject(genResponse(expectedBody.status, expectedBody));
  });

  it("accepts a dateTo that is in the future", () => {
    const payload1 = { params: { dateTo: "2100-01-01" } };
    return expect(axios.get(url, payload1)).resolves.toBeTruthy();
  });

  it("responds with 400 on malformed dateTo", () => {
    const expectedBody: RequestError = {
      status: 400,
      errors: ['Malformed date in property "dateTo"'],
    };
    const payload = { params: { dateFrom: "2020-02-20", dateTo: "turku" } };
    return expect(axios.get(url, payload)).rejects.toMatchObject(genResponse(expectedBody.status, expectedBody));
  });

  it("has exactly four stable files", async () => {
    const payload = { params: { volatile: "false" } };
    const res = await axios.get(url, payload);
    return expect(res.data).toHaveLength(4);
  });

  it("does not show test files in normal mode", async () => {
    const payload = { params: { site: "granada" } };
    expectedBody404.errors = ["One or more of the specified sites were not found"];
    return expect(axios.get(url, payload)).rejects.toMatchObject(genResponse(expectedBody404.status, expectedBody404));
  });

  it("shows test files in developer mode", async () => {
    const payload = { params: { site: "granada", developer: "" } };
    return expect(axios.get(url, payload)).resolves.toBeTruthy();
  });

  it("returns newest file by default", async () => {
    const res = await axios.get(url, { params: { product: "categorize", dateTo: "2019-07-15" } });
    expect(res.data).toHaveLength(1);
    expect(res.data[0].uuid).toEqual("8bb32746-faf0-4057-9076-ed2e698dcf36");
  });

  it("returns optionally all versions of a file sorted by updatedAt", async () => {
    const res = await axios.get(url, { params: { product: "categorize", dateTo: "2019-07-15", allVersions: "" } });
    expect(res.data).toHaveLength(3);
    expect(new Date(res.data[0].updatedAt).getTime()).toBeGreaterThan(new Date(res.data[1].updatedAt).getTime());
    expect(new Date(res.data[1].updatedAt).getTime()).toBeGreaterThan(new Date(res.data[2].updatedAt).getTime());
  });

  it("returns all versions of a file sorted by updatedAt, with legacy files listed last", async () => {
    const res = await axios.get(url, {
      params: { site: "bucharest", product: "categorize", date: "2021-01-26", allVersions: "", showLegacy: "" },
    });
    expect(res.data).toHaveLength(4);
    expect(res.data[2].legacy).toBeTruthy();
    expect(res.data[3].legacy).toBeTruthy();
    expect(new Date(res.data[0].updatedAt).getTime()).toBeGreaterThan(new Date(res.data[1].updatedAt).getTime());
    expect(new Date(res.data[2].updatedAt).getTime()).toBeGreaterThan(new Date(res.data[3].updatedAt).getTime());
  });

  it("returns the latest file when limit=1", async () => {
    const res = await axios.get(url, { params: { site: "bucharest", limit: "1" } });
    expect(res.data).toHaveLength(1);
    expect(res.data[0].measurementDate).toEqual("2021-02-20");
  });

  it("responds with 400 on malformed limit", async () => {
    const payload = { params: { site: "bucharest", limit: "j" } };
    const expectedBody: RequestError = {
      status: 400,
      errors: ['Malformed value in property "limit"'],
    };
    return expect(axios.get(url, payload)).rejects.toMatchObject(genResponse(expectedBody.status, expectedBody));
  });

  it("by default does not show legacy data", async () => {
    const payload = {
      params: { site: "bucharest", product: "classification", dateFrom: "2009-01-01", dateTo: "2010-01-01" },
    };
    return expect(axios.get(url, payload)).resolves.toMatchObject({ data: [] });
  });
  it("shows legacy data when using showLegacy flag", async () => {
    const payload = {
      params: {
        site: "bucharest",
        product: "classification",
        dateFrom: "2009-01-01",
        dateTo: "2010-01-01",
        showLegacy: true,
      },
    };
    return expect(axios.get(url, payload)).resolves.toMatchObject({ data: [{ legacy: true }] });
  });

  it("includes s3path when requested", async () => {
    const payload = {
      params: {
        site: "bucharest",
        product: "classification",
        dateFrom: "2009-01-01",
        dateTo: "2010-01-01",
        showLegacy: true,
        s3path: true,
      },
    };
    const res = await axios.get(url, payload);
    return expect(res.data[0]).toMatchObject({
      s3path: "/cloudnet-product/legacy/20090716_bucharest_classification.nc",
    });
  });

  it("responds with data for one day when using the date parameter", async () => {
    const payload = { params: { date: "2018-11-15" } };
    const res = await axios.get(url, payload);
    expect(res.data).toHaveLength(1);
    return expect(res.data[0]).toMatchObject({ measurementDate: "2018-11-15" });
  });

  it("responds with 400 on malformed date", async () => {
    const payload = { params: { date: "j" } };
    const expectedBody: RequestError = {
      status: 400,
      errors: ['Malformed date in property "date"'],
    };
    return expect(axios.get(url, payload)).rejects.toMatchObject(genResponse(expectedBody.status, expectedBody));
  });

  it("responds with 400 on conflicting date, dateFrom and dateTo", async () => {
    const validParams = { date: "2020-12-05" };
    const expectedBody: RequestError = {
      status: 400,
      errors: ['Property "date" may not be defined if either "dateFrom" or "dateTo" is defined'],
    };
    let params: any = { ...validParams, ...{ dateFrom: "2020-11-05" } };
    await expect(axios.get(url, { params })).rejects.toMatchObject(genResponse(expectedBody.status, expectedBody));
    params = { ...validParams, ...{ dateTo: "2020-12-08" } };
    await expect(axios.get(url, { params })).rejects.toMatchObject(genResponse(expectedBody.status, expectedBody));
    params = { ...validParams, ...{ dateFrom: "2020-11-05", dateTo: "2020-12-08" } };
    return expect(axios.get(url, { params })).rejects.toMatchObject(genResponse(expectedBody.status, expectedBody));
  });

  it("responds with correct data using filename parameter", async () => {
    const filename = "20181115_mace-head_mira.nc";
    const payload = { params: { filename } };
    const res = await axios.get(url, payload);
    expect(res.data).toHaveLength(1);
    return expect(res.data[0]).toMatchObject({ filename });
  });

  it("filters with updatedAt", async () => {
    const payload = {
      params: {
        allVersions: true,
        showLegacy: true,
        updatedAtFrom: "2020-02-21T00:00:00.000Z",
        updatedAtTo: "2020-02-22T00:00:00.000Z",
      },
    };
    const res = await axios.get(url, payload);
    expect(res.data).toHaveLength(2);
    expect(res.data[0]).toMatchObject({ uuid: "62b32746-faf0-4057-9076-ed2e698dcc34" });
    return expect(res.data[1]).toMatchObject({ uuid: "72b32746-faf0-4057-9076-ed2e698dcc34" });
  });
});

describe("/api/model-files", () => {
  const url = `${backendPublicUrl}model-files/`;

  it("responds with the best model file by default", async () => {
    const payload = { params: { site: "bucharest", dateFrom: "2020-12-05", dateTo: "2020-12-05" } };
    const res = await axios.get(url, payload);
    expect(res.data).toHaveLength(1);
    return expect(res.data[0]).toMatchObject({ model: { id: "ecmwf" } });
  });

  it("includes s3path when requests", async () => {
    const payload = { params: { site: "bucharest", dateFrom: "2020-12-05", dateTo: "2020-12-05", s3path: true } };
    const res = await axios.get(url, payload);
    return expect(res.data[0]).toMatchObject({ s3path: "/cloudnet-product-volatile/20141205_mace-head_ecmwf.nc" });
  });

  it("responds with the specified model file", async () => {
    const payload = {
      params: { site: "bucharest", dateFrom: "2020-12-05", dateTo: "2020-12-05", model: "icon-iglo-12-23" },
    };
    const res = await axios.get(url, payload);
    expect(res.data).toHaveLength(1);
    return expect(res.data[0]).toMatchObject({ model: { id: "icon-iglo-12-23" } });
  });

  it("responds with all model files with allModels flag ordered by model quality", async () => {
    const payload = { params: { site: "bucharest", dateFrom: "2020-12-05", dateTo: "2020-12-05", allModels: true } };
    const res = await axios.get(url, payload);
    expect(res.data).toHaveLength(2);
    expect(res.data[0]).toMatchObject({ model: { id: "ecmwf" } });
    expect(res.data[1]).toMatchObject({ model: { id: "icon-iglo-12-23" } });
  });

  it("responds with 400 if model and allModels are both defined", async () => {
    const payload = { params: { model: "ecmwf", allModels: true } };
    const expectedBody: RequestError = {
      status: 400,
      errors: ['Properties "allModels" and "model" can not be both defined'],
    };
    return expect(axios.get(url, payload)).rejects.toMatchObject(genResponse(expectedBody.status, expectedBody));
  });

  it("responds with 400 on invalid search params", async () => {
    await expect(axios.get(url, { params: { allVersions: true } })).rejects.toMatchObject({
      response: { status: 400 },
    });
    await expect(axios.get(url, { params: { product: "classification" } })).rejects.toMatchObject({
      response: { status: 400 },
    });
    return expect(axios.get(url, { params: { showLegacy: true } })).rejects.toMatchObject({
      response: { status: 400 },
    });
  });

  it("responds with 404 if a specified model is not found", async () => {
    const payload = { params: { model: "sammakko" } };
    const expectedBody: RequestError = {
      status: 404,
      errors: ["One or more of the specified models were not found"],
    };
    return expect(axios.get(url, payload)).rejects.toMatchObject(genResponse(expectedBody.status, expectedBody));
  });
});

describe("/api/search", () => {
  const url = `${backendPublicUrl}search/`;

  it("responds with correct objects if dateFrom, dateTo, site, and product are specified", async () => {
    const expectedData = [responses["allsearch"][2]];
    const payload = {
      params: {
        dateFrom: "2018-06-09",
        dateTo: "2019-09-02",
        site: "mace-head",
        product: "classification",
      },
    };
    const res = await axios.get(url, payload);
    return expect(res.data).toMatchObject(expectedData);
  });

  it("does not return hidden sites", async () => {
    const payload = { params: { date: "2021-01-22" } };
    const { data } = await axios.get(url, payload);
    return expect(data).toHaveLength(0);
  });

  it("returns the latest file when limit=1", async () => {
    const res = await axios.get(url, { params: { site: "bucharest", limit: "1" } });
    expect(res.data).toHaveLength(1);
    expect(res.data[0].measurementDate).toEqual("2021-02-20");
  });
});
