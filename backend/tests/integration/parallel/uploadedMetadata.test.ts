import { DataSource } from "typeorm";
import { AppDataSource } from "../../../src/data-source";
import { backendPrivateUrl, backendPublicUrl } from "../../lib";
import axios from "axios";
import { readResources } from "../../../../shared/lib";
import { describe, expect, it, beforeAll, afterAll } from "@jest/globals";

const protectedUrl = `${backendPrivateUrl}upload/metadata/`;
const privateUrl = `${backendPrivateUrl}upload-metadata/`;
const privateModelUrl = `${backendPrivateUrl}upload-model-metadata/`;
const rawFilesUrl = `${backendPublicUrl}raw-files/`;
const rawModelFilesUrl = `${backendPublicUrl}raw-model-files/`;

let dataSource: DataSource;
let instResp: any;
let modelResp: any;
let expected: any;

beforeAll(async () => {
  const responses = await readResources();
  instResp = responses["uploaded-metadata"];
  modelResp = responses["uploaded-model-metadata"];
  expected = instResp[0];
  dataSource = await AppDataSource.initialize();
  await dataSource.query("REFRESH MATERIALIZED VIEW instrument_latest_upload");
});

afterAll(async () => await dataSource.destroy());

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
      axios.get(`${rawFilesUrl}`, { params: { instrument: "mira-35", developer: true } }),
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
  it("responds with correct stare record", async () => {
    const res = await axios.get(`${rawFilesUrl}`, {
      params: { filename: "Stare_213_20221205_04.hpl", developer: true },
    });
    expect(res.data).toHaveLength(1);
    expect(res).toMatchObject({
      status: 200,
      data: [{ filename: "Stare_213_20221205_04.hpl" }],
    });
  });
  it("responds with correct stare record", async () => {
    const res = await axios.get(`${rawFilesUrl}`, {
      params: { filenameSuffix: ".hpl", developer: true },
    });
    expect(res.data).toHaveLength(1);
    expect(res).toMatchObject({
      status: 200,
      data: [{ filename: "Stare_213_20221205_04.hpl" }],
    });
  });
  it("responds with correct stare and mira record", async () => {
    const res = await axios.get(`${rawFilesUrl}`, {
      params: { filenamePrefix: ["Stare", "file1"], developer: true },
    });
    expect(res.data).toHaveLength(2);
    expect(res.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ filename: "Stare_213_20221205_04.hpl" }),
        expect.objectContaining({ filename: "file1-dc460da4ad72c48223.LV1" }),
      ]),
    );
  });
  it("responds with correct stare record", async () => {
    const res = await axios.get(`${rawFilesUrl}`, {
      params: { filenamePrefix: ["Stare", "file1"], filenameSuffix: "hpl", developer: true },
    });
    expect(res.data).toHaveLength(1);
    expect(res).toMatchObject({
      status: 200,
      data: [{ filename: "Stare_213_20221205_04.hpl" }],
    });
  });
  it("responds with 400 if prefix empty", async () => {
    await expect(
      axios.get(`${rawFilesUrl}`, {
        params: { filenamePrefix: "", developer: true },
      }),
    ).rejects.toMatchObject({ response: { status: 400 } });
  });
  it("responds with 400 if prefixes empty", async () => {
    await expect(
      axios.get(`${rawFilesUrl}`, {
        params: { filenamePrefix: ["", ""], developer: true },
      }),
    ).rejects.toMatchObject({ response: { status: 400 } });
  });
  it("responds with empty array if non existing filename", async () => {
    const res = await axios.get(`${rawFilesUrl}`, {
      params: { filename: "i-dont-exist.LV0", developer: true },
    });
    expect(res.data).toHaveLength(0);
    expect(res).toMatchObject({
      status: 200,
    });
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

describe("GET /api/raw-files/:uuid", () => {
  it("responds with 404 when uuid is not found", async () => {
    return expect(axios.get(`${rawFilesUrl}00000000-0000-0000-0000-000000000000`)).rejects.toMatchObject({
      response: { status: 404 },
    });
  });

  it("model upload is not found via instrument endpoint", async () => {
    return expect(axios.get(`${rawFilesUrl}1bb32743-faf0-4057-9076-ed2e698dcf26`)).rejects.toMatchObject({
      response: { status: 404 },
    });
  });

  it("request succeeds on granada instrument upload", async () => {
    const res = await axios.get(`${rawFilesUrl}b8e96ee1-d3e1-49ba-a557-c131d56beeab`);
    expect(res.data).toMatchSnapshot();
  });

  it("request succeeds on bucharest instrument upload", async () => {
    const res = await axios.get(`${rawFilesUrl}b4633e6b-a3fc-4d55-b9f4-8033b4896117`);
    expect(res.data).toMatchSnapshot();
  });
});

describe("GET /api/raw-model-files/:uuid", () => {
  it("responds with 404 when uuid is not found", async () => {
    return expect(axios.get(`${rawModelFilesUrl}00000000-0000-0000-0000-000000000000`)).rejects.toMatchObject({
      response: { status: 404 },
    });
  });

  it("instrument upload is not found via model endpoint", async () => {
    return expect(axios.get(`${rawModelFilesUrl}b8e96ee1-d3e1-49ba-a557-c131d56beeab`)).rejects.toMatchObject({
      response: { status: 404 },
    });
  });

  it("request succeeds on granada ecmwf model upload", async () => {
    const res = await axios.get(`${rawModelFilesUrl}1bb32743-faf0-4057-9076-ed2e698dcf26`);
    expect(res.data).toMatchSnapshot();
  });

  it("request succeeds on mace-head ecmwf model upload", async () => {
    const res = await axios.get(`${rawModelFilesUrl}1bb32748-faf0-4057-9076-ed2e698dcf31`);
    expect(res.data).toMatchSnapshot();
  });

  it("request succeeds on granada icon-iglo model upload", async () => {
    const res = await axios.get(`${rawModelFilesUrl}1bb32744-faf0-4057-9076-ed2e698dcf16`);
    expect(res.data).toMatchSnapshot();
  });
});

describe("GET /upload-metadata", () => {
  it("response has s3path", async () => {
    const res = await axios.get(`${privateUrl}`, {
      params: { dateFrom: "2020-08-11", dateTo: "2020-08-11", developer: true },
    });
    expect(res.data.map((row: any) => row.s3path)).toEqual(["/cloudnet-upload/granada/file1-dc460da4ad72c48223.LV1"]);
  });
});

describe("GET /upload-model-metadata", () => {
  it("response has s3path", async () => {
    const res = await axios.get(`${privateModelUrl}`, { params: { model: "icon-iglo-12-23", developer: true } });
    expect(res.data.map((row: any) => row.s3path)).toEqual([
      "/cloudnet-upload/granada/20180126_granada_icon-iglo-12-23.nc",
      "/cloudnet-upload/bucharest/20200122_bucharest_icon-iglo-12-23.nc",
    ]);
  });
});

describe("GET /api/uploaded-metadata", () => {
  const publicUrl = `${backendPublicUrl}uploaded-metadata/`;
  it("responds with correct object when filtering with site", async () => {
    const res = await axios.get(`${publicUrl}`, { params: { site: "bucharest" } });
    const expectedPids = [
      "https://hdl.handle.net/123/bucharest-chm15k",
      "https://hdl.handle.net/123/bucharest-chm15k-II",
      "https://hdl.handle.net/123/bucharest-hatpro",
      "https://hdl.handle.net/123/bucharest-mira",
    ];
    const receivedPids = res.data.map((item: any) => item.instrument.pid);
    expect(receivedPids.sort()).toEqual(expectedPids.sort());
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
