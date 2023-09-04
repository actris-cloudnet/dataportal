import { backendPrivateUrl, backendPublicUrl } from "../../lib";
import axios from "axios";
import { readResources } from "../../../../shared/lib";
import { describe, expect, it, beforeAll } from "@jest/globals";

const protectedUrl = `${backendPrivateUrl}upload/metadata/`;
const privateUrl = `${backendPrivateUrl}upload-metadata/`;
const privateModelUrl = `${backendPrivateUrl}upload-model-metadata/`;
const rawFilesUrl = `${backendPublicUrl}raw-files/`;
const rawModelFilesUrl = `${backendPublicUrl}raw-model-files/`;

let instResp: any;
let modelResp: any;
let expected: any;

beforeAll(async () => {
  const responses = await readResources();
  instResp = responses["uploaded-metadata"];
  modelResp = responses["uploaded-model-metadata"];
  expected = instResp[0];
});

describe("GET /upload/metadata/:checksum", () => {
  it("responds with 200 when metadata is found", async () => {
    const validId = expected.checksum;
    return expect(axios.get(`${protectedUrl}${validId}`)).resolves.toMatchObject({ status: 200, data: expected });
  });

  it("responds with 400 when hash is invalid", async () => {
    const invalidHash = "123456789012345678";
    return expect(axios.get(`${protectedUrl}${invalidHash}`)).rejects.toMatchObject({ response: { status: 400 } });
  });

  it("responds with 404 when hash is not found", async () => {
    const invalidHash = "12345678901234567892123456789012";
    return expect(axios.get(`${protectedUrl}${invalidHash}`)).rejects.toMatchObject({ response: { status: 404 } });
  });
});

describe("GET /api/raw-files", () => {
  it("without arguments responds with 400", async () => {
    return expect(axios.get(`${rawFilesUrl}`)).rejects.toMatchObject({ response: { status: 400 } });
  });

  it("responds with correct object when filtering with date", async () => {
    return expect(
      axios.get(`${rawFilesUrl}`, { params: { dateFrom: "2020-08-11", dateTo: "2020-08-11", developer: true } }),
    ).resolves.toMatchObject({ status: 200, data: [instResp[0]] });
  });

  it("responds with correct object when filtering with date 2", async () => {
    return expect(
      axios.get(`${rawFilesUrl}`, { params: { date: "2020-08-11", developer: true } }),
    ).resolves.toMatchObject({ status: 200, data: [instResp[0]] });
  });

  it("responds with correct object when filtering with site", async () => {
    return expect(axios.get(`${rawFilesUrl}`, { params: { site: "granada", developer: true } })).resolves.toMatchObject(
      { status: 200, data: [instResp[0]] },
    );
  });

  it("responds with correct object when filtering with status", async () => {
    return expect(
      axios.get(`${rawFilesUrl}`, { params: { status: "processed", developer: true } }),
    ).resolves.toMatchObject({ status: 200, data: [instResp[1], instResp[2]] });
  });

  it("responds with correct object when filtering with instrument", async () => {
    return expect(
      axios.get(`${rawFilesUrl}`, { params: { instrument: "mira", developer: true } }),
    ).resolves.toMatchObject({ status: 200, data: [instResp[0], instResp[3]] });
  });

  it("responds with correct object when filtering with halo-doppler-lidar", async () => {
    return expect(
      axios.get(`${rawFilesUrl}`, { params: { instrument: "halo-doppler-lidar", developer: true } }),
    ).resolves.toMatchObject({ status: 200, data: [instResp[4]] });
  });

  it("responds with correct object when filtering with updatedAt", async () => {
    return expect(
      axios.get(`${rawFilesUrl}`, {
        params: { updatedAtFrom: "2020-09-27T00:00:00.000Z", updatedAtTo: "2020-09-28T00:00:00.000Z", developer: true },
      }),
    ).resolves.toMatchObject({ status: 200, data: [instResp[0]] });
  });

  it("response does not have s3path", async () => {
    const res = await axios.get(`${rawFilesUrl}`, {
      params: { dateFrom: "2020-08-11", dateTo: "2020-08-11", developer: true },
    });
    expect(res.data[0]).not.toHaveProperty("s3path");
  });
});

describe("GET /api/raw-model-files", () => {
  it("without arguments responds with 400", async () => {
    return expect(axios.get(`${rawModelFilesUrl}`)).rejects.toMatchObject({ response: { status: 400 } });
  });

  it("responds with correct object when filtering with model", async () => {
    return expect(
      axios.get(`${rawModelFilesUrl}`, { params: { model: "icon-iglo-12-23", developer: true } }),
    ).resolves.toMatchObject({ status: 200, data: [modelResp[2], modelResp[3]] });
  });
});

describe("GET /upload-metadata", () => {
  it("response has s3path", async () => {
    const res = await axios.get(`${privateUrl}`, {
      params: { dateFrom: "2020-08-11", dateTo: "2020-08-11", developer: true },
    });
    expect(res.data[0]).toHaveProperty("s3path");
  });
});

describe("GET /upload-model-metadata", () => {
  it("response has s3path", async () => {
    const res = await axios.get(`${privateModelUrl}`, { params: { model: "icon-iglo-12-23", developer: true } });
    expect(res.data[0]).toHaveProperty("s3path");
  });
});

describe("GET /api/uploaded-metadata", () => {
  const publicUrl = `${backendPublicUrl}uploaded-metadata/`;
  it("responds with correct object when filtering with site", async () => {
    return expect(axios.get(`${publicUrl}`, { params: { site: "bucharest" } })).resolves.toMatchObject({
      status: 200,
      data: [{ instrument: instResp[2]["instrument"] }, { instrument: instResp[3]["instrument"] }],
    });
  });
});

describe("GET /api/upload-dateforsize", () => {
  const publicUrl = `${backendPublicUrl}upload-dateforsize/`;
  it("responds with date corresponding with the target size", async () => {
    return expect(
      axios.get(`${publicUrl}`, { params: { startDate: "2020-09-27T12:45:21.916Z", targetSize: "30" } }),
    ).resolves.toMatchObject({ status: 200, data: "2020-09-28T12:47:21.916Z" });
  });

  it("responds with 400 if there is not enough data", async () => {
    return expect(
      axios.get(`${publicUrl}`, { params: { startDate: "2020-09-28T12:47:21.916Z", targetSize: "30" } }),
    ).rejects.toMatchObject({ response: { status: 400 } });
  });
});
