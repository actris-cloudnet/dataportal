import axios from "axios";
import { backendPublicUrl, genResponse } from "../../lib";
import { describe, expect, it } from "@jest/globals";

const url = `${backendPublicUrl}visualizations/`;
const headers = { "content-type": "application/json" };

const expectedResult = {
  sourceFileId: "38092c00-161d-4ca2-a29d-628cf8e960f6",
  source: {
    pid: "https://hdl.handle.net/123/bucharest-mira",
    uuid: "0b3a7fa0-4812-4964-af23-1162e8b3a665",
    name: "Bucharest MIRA",
    serialNumber: null,
    model: "MIRA",
    type: "cloud radar",
    owners: ["University of Bucharest"],
    instrument: {
      allowedTags: [],
      downloadable: true,
      humanReadableName: "METEK MIRA-35 cloud radar",
      id: "mira-35",
      shortName: "MIRA",
      type: "radar",
    },
  },
  locationHumanReadable: "Mace Head",
  productHumanReadable: "Radar",
  volatile: true,
  legacy: false,
  visualizations: [
    {
      s3key: "test1.png",
      productVariable: { id: "test2", humanReadableName: "Kaljanhimo", order: 0 },
    },
    {
      s3key: "test0.png",
      productVariable: { id: "test1", humanReadableName: "Auringonpaisteen määrä", order: 1 },
    },
  ],
};

const expectedModelResult = {
  sourceFileId: "a5d1d5af-3667-41bc-b952-e684f627d91c",
  source: {
    id: "ecmwf",
    optimumOrder: 0,
    humanReadableName: "ECMWF forecast",
  },
  locationHumanReadable: "Mace Head",
  productHumanReadable: "Model",
  volatile: true,
  legacy: false,
  visualizations: [
    {
      s3key: "test3.png",
      productVariable: { id: "test1", humanReadableName: "Auringonpaisteen määrä", order: 1 },
    },
  ],
};

const expectedClassificationResult = {
  sourceFileId: "bde7a35f-03aa-4bff-acfb-b4974ea9f217",
  source: null,
  productHumanReadable: "Classification",
  locationHumanReadable: "Mace Head",
  legacy: false,
  volatile: true,
  visualizations: [
    {
      s3key: "test2.png",
      productVariable: { id: "test1", humanReadableName: "Auringonpaisteen määrä", order: 1 },
    },
  ],
};

describe("GET /visualizations", () => {
  it("on no results returns empty list and responds with 200", async () => {
    const res = await axios.get(url, { headers, params: { product: "lidar" } });
    expect(res.status).toEqual(200);
    expect(res.data).toEqual([]);
  });

  it("on valid search returns correct list of visualizations and responds with 200", async () => {
    const res = await axios.get(url, { headers, params: { product: "radar" } });
    expect(res.status).toEqual(200);
    expect(res.data).toMatchObject([expectedResult]);
  });

  it("on valid search returns correct list of model visualizations and responds with 200", async () => {
    const res = await axios.get(url, { headers, params: { product: "model" } });
    expect(res.status).toEqual(200);
    expect(res.data).toMatchObject([expectedModelResult]);
  });

  it("on classification search returns null source and responds with 200", async () => {
    const res = await axios.get(url, { headers, params: { product: "classification" } });
    expect(res.status).toEqual(200);
    expect(res.data.length).toBeGreaterThan(0);
    expect(res.data[0]).toMatchObject(expectedClassificationResult);
  });
});

describe("GET /visualizations/:uuid", () => {
  it("responds 404 if invalid uuid", () =>
    expect(axios.get(`${url}kisseliini`)).rejects.toMatchObject(
      genResponse(404, { errors: ["Not found: invalid UUID"] }),
    ));

  it("returns correct list of visualizations and responds with 200", async () => {
    const res = await axios.get(`${url}${expectedResult.sourceFileId}`);
    expect(res.status).toEqual(200);
    expect(res.data).toMatchObject(expectedResult);
  });

  it("returns correct list of model visualizations and responds with 200", async () => {
    const res = await axios.get(`${url}${expectedModelResult.sourceFileId}`);
    expect(res.status).toEqual(200);
    expect(res.data).toMatchObject(expectedModelResult);
  });

  it("returns null source for classification file and responds with 200", async () => {
    const res = await axios.get(`${url}${expectedClassificationResult.sourceFileId}`);
    expect(res.status).toEqual(200);
    expect(res.data).toMatchObject(expectedClassificationResult);
  });
});
