import axios from "axios";
import { Connection, createConnection } from "typeorm/";
import { backendPrivateUrl, backendPublicUrl, str2base64 } from "../../lib";
import { Status } from "../../../src/entity/Upload";
import { promises as fsp } from "fs";
import { initUsersAndPermissions } from "../../lib/userAccountAndPermissions";

const crypto = require("crypto");

let conn: Connection;
let instrumentRepo: any;
let modelRepo: any;
let miscUploadRepo: any;

const metadataUrl = `${backendPrivateUrl}api/test/upload/metadata/`;
const modelMetadataUrl = `${backendPrivateUrl}api/test/model-upload/metadata/`;
const publicMetadataUrl = `${backendPublicUrl}raw-files/`;
const privateMetadataUrl = `${backendPrivateUrl}upload-metadata/`;
const dataUrl = `${backendPrivateUrl}api/test/upload/data/`;
const modelDataUrl = `${backendPrivateUrl}api/test/model-upload/data/`;

const userCredentials = {
  alice: "alices_password",
  bob: "bobs_pass",
  carol: "carols-passphrase",
  david: "davids^passphrase",
  eve: "eves_passphraase",
  bucharest: "passWordForBucharest",
  granada: "PASSWORDFORgranada",
  "mace-head": "SfSCHhnU5cjrMiLdgcW3ixkTQRo",
};

const validMetadata = {
  filename: "file1.LV1",
  measurementDate: "2020-08-11",
  checksum: "9a0364b9e99bb480dd25e1f0284c8555",
  instrument: "mira",
  site: "granada",
};

const validMetadataAndStableProduct = {
  filename: "file1.LV1",
  measurementDate: "2021-02-20",
  checksum: "3a0364b9e99bb480dd25e1f0284c8555",
  instrument: "mira",
  site: "bucharest",
};

const validMetadataAndVolatileProduct = {
  filename: "file1.LV1",
  measurementDate: "2018-11-15",
  checksum: "3a0364b9e99bb480dd25e1f0284c8555",
  instrument: "mira",
  site: "mace-head",
};

const validModelMetadata = {
  filename: "19990101_granada_ecmwf.nc",
  measurementDate: "1999-01-01",
  checksum: "60b725f10c9c85c70d97880dfe8191b3",
  model: "ecmwf",
  site: "bucharest",
};

const headers = { authorization: `Basic ${str2base64("granada:PASSWORDFORgranada")}` };

beforeAll(async () => {
  conn = await createConnection();
  instrumentRepo = conn.getRepository("instrument_upload");
  modelRepo = conn.getRepository("model_upload");
  miscUploadRepo = conn.getRepository("misc_upload");
  // Make sure these tables are initialized correctly
  await conn
    .getRepository("regular_file")
    .save(JSON.parse((await fsp.readFile("fixtures/2-regular_file.json")).toString()));
  await conn
    .getRepository("model_file")
    .save(JSON.parse((await fsp.readFile("fixtures/2-model_file.json")).toString()));

  await instrumentRepo.delete({});
  await modelRepo.delete({});
  await miscUploadRepo.delete({});

  await initUsersAndPermissions();
});

afterAll(async () => {
  await Promise.all([instrumentRepo.delete({}), modelRepo.delete({})]);
  return conn.close();
});

describe("POST /upload/metadata", () => {
  beforeEach(async () => {
    await instrumentRepo.delete({});
    await miscUploadRepo.delete({});
    return;
  });

  test("inserts new metadata", async () => {
    const now = new Date();
    await expect(axios.post(metadataUrl, validMetadata, { headers })).resolves.toMatchObject({ status: 200 });
    const md = await instrumentRepo.findOne({ checksum: validMetadata.checksum });
    expect(md).toBeTruthy();
    expect(new Date(md.createdAt).getTime()).toBeGreaterThan(now.getTime());
    expect(new Date(md.updatedAt).getTime()).toEqual(new Date(md.createdAt).getTime());
    return expect(md.status).toEqual(Status.CREATED);
  });

  test("inserts new metadata if different date", async () => {
    const payload = { ...validMetadata };
    await expect(axios.post(metadataUrl, payload, { headers })).resolves.toMatchObject({ status: 200 });
    const payloadResub = { ...payload, measurementDate: "2020-08-12", checksum: "ac5c1f6c923cc8b259c2e22c7b258ee4" };
    await expect(axios.post(metadataUrl, payloadResub, { headers })).resolves.toMatchObject({ status: 200 });
    await instrumentRepo.findOneOrFail({ checksum: payload.checksum });
    return await instrumentRepo.findOneOrFail({ checksum: payloadResub.checksum });
  });

  test("inserts new metadata if different filename", async () => {
    const payload = { ...validMetadata };
    await expect(axios.post(metadataUrl, payload, { headers })).resolves.toMatchObject({ status: 200 });
    const payloadResub = { ...payload, filename: "random_results.nc", checksum: "ac5c1f6c923cc8b259c2e22c7b258ee4" };
    await expect(axios.post(metadataUrl, payloadResub, { headers })).resolves.toMatchObject({ status: 200 });
    await instrumentRepo.findOneOrFail({ checksum: payload.checksum });
    return await instrumentRepo.findOneOrFail({ checksum: payloadResub.checksum });
  });

  test("inserts new metadata if different instrument", async () => {
    const payload = { ...validMetadata };
    await expect(axios.post(metadataUrl, payload, { headers })).resolves.toMatchObject({ status: 200 });
    const payloadResub = { ...payload, instrument: "hatpro", checksum: "ac5c1f6c923cc8b259c2e22c7b258ee4" };
    await expect(axios.post(metadataUrl, payloadResub, { headers })).resolves.toMatchObject({ status: 200 });
    await instrumentRepo.findOneOrFail({ checksum: payload.checksum });
    return await instrumentRepo.findOneOrFail({ checksum: payloadResub.checksum });
  });

  test("inserts new metadata for misc upload", async () => {
    const now = new Date();
    const payload = { ...validMetadata, instrument: "halo-doppler-lidar" };
    await expect(axios.post(metadataUrl, payload, { headers })).resolves.toMatchObject({ status: 200 });
    const md = await miscUploadRepo.findOne({ checksum: validMetadata.checksum });
    expect(md).toBeTruthy();
    expect(new Date(md.createdAt).getTime()).toBeGreaterThan(now.getTime());
    expect(new Date(md.updatedAt).getTime()).toEqual(new Date(md.createdAt).getTime());
    return expect(md.status).toEqual(Status.CREATED);
  });

  test("updates existing metadata", async () => {
    const payload = { ...validMetadata };
    const expectedResponse = { status: 200, data: "OK" };
    await expect(axios.post(metadataUrl, payload, { headers })).resolves.toMatchObject(expectedResponse);
    const md = await instrumentRepo.findOne({ checksum: payload.checksum });
    expect(md.checksum).toBe(validMetadata.checksum);
    const initialTime = new Date(md.updatedAt).getTime();
    const payloadResub = { ...payload, checksum: "ac5c1f6c923cc8b259c2e22c7b258ee4" };
    await expect(axios.post(metadataUrl, payloadResub, { headers })).resolves.toMatchObject(expectedResponse);
    expect(await instrumentRepo.findOne({ checksum: payload.checksum })).toBe(undefined);
    const mdResub = await instrumentRepo.findOne(md.uuid);
    expect(mdResub.checksum).toBe(payloadResub.checksum);
    const ResubTime = new Date(mdResub.updatedAt).getTime();
    return expect(ResubTime).toBeGreaterThan(initialTime);
  });

  test("updates existing metadata if stable product", async () => {
    const headers = { authorization: `Basic ${str2base64("bucharest:passWordForBucharest")}` };
    const payload = { ...validMetadataAndStableProduct };
    await expect(axios.post(metadataUrl, payload, { headers })).resolves.toMatchObject({ status: 200 });
    const payloadResub = { ...payload, checksum: "ac5c1f6c923cc8b259c2e22c7b258ee4" };
    await expect(axios.post(metadataUrl, payloadResub, { headers })).resolves.toMatchObject({ status: 200 });
    await instrumentRepo.findOneOrFail({ checksum: payloadResub.checksum });
    const md = await instrumentRepo.findOne({ checksum: payload.checksum });
    return expect(md).toBe(undefined);
  });

  test("updates existing metadata if volatile product", async () => {
    const headers = { authorization: `Basic ${str2base64("mace-head:SfSCHhnU5cjrMiLdgcW3ixkTQRo")}` };
    const payload = { ...validMetadataAndVolatileProduct };
    await expect(axios.post(metadataUrl, payload, { headers })).resolves.toMatchObject({ status: 200 });
    const payloadResub = { ...payload, checksum: "ac5c1f6c923cc8b259c2e22c7b258ee4" };
    await expect(axios.post(metadataUrl, payloadResub, { headers })).resolves.toMatchObject({ status: 200 });
    await instrumentRepo.findOneOrFail({ checksum: payloadResub.checksum });
    const md = await instrumentRepo.findOne({ checksum: payload.checksum });
    return expect(md).toBe(undefined);
  });

  test("updates existing metadata with allowUpdate = true", async () => {
    const payload = { ...validMetadata, allowUpdate: true };
    const expectedResponse = { status: 200, data: "Warning: Ignoring obsolete allowUpdate property" };
    await expect(axios.post(metadataUrl, payload, { headers })).resolves.toMatchObject(expectedResponse);
    const md = await instrumentRepo.findOne({ checksum: payload.checksum });
    expect(md.checksum).toBe(validMetadata.checksum);
    const payloadResub = { ...payload, checksum: "ac5c1f6c923cc8b259c2e22c7b258ee4" };
    await expect(axios.post(metadataUrl, payloadResub, { headers })).resolves.toMatchObject(expectedResponse);
    expect(await instrumentRepo.findOne({ checksum: payload.checksum })).toBe(undefined);
    const mdResub = await instrumentRepo.findOne(md.uuid);
    return expect(mdResub.checksum).toBe(payloadResub.checksum);
  });

  test("updates existing metadata with allowUpdate = false", async () => {
    const payload = { ...validMetadata, allowUpdate: false };
    const expectedResponse = { status: 200, data: "Warning: Ignoring obsolete allowUpdate property" };
    await expect(axios.post(metadataUrl, payload, { headers })).resolves.toMatchObject(expectedResponse);
    const md = await instrumentRepo.findOne({ checksum: payload.checksum });
    expect(md.checksum).toBe(validMetadata.checksum);
    const payloadResub = { ...payload, checksum: "ac5c1f6c923cc8b259c2e22c7b258ee4" };
    await expect(axios.post(metadataUrl, payloadResub, { headers })).resolves.toMatchObject(expectedResponse);
    expect(await instrumentRepo.findOne({ checksum: payload.checksum })).toBe(undefined);
    const mdResub = await instrumentRepo.findOne(md.uuid);
    return expect(mdResub.checksum).toBe(payloadResub.checksum);
  });

  test("responds with 200 on existing hashsum with created status", async () => {
    await axios.post(metadataUrl, validMetadata, { headers });
    return expect(axios.post(metadataUrl, validMetadata, { headers })).resolves.toMatchObject({ status: 200 });
  });

  test("responds with 422 if both model and instrument fields are specified", async () => {
    const newMetadata = { ...validMetadata, model: "ecmwf" };
    return await expect(axios.post(metadataUrl, newMetadata, { headers })).rejects.toMatchObject({
      response: { status: 422 },
    });
  });

  test("responds with 409 on existing hashsum with uploaded status", async () => {
    const now = new Date();
    const uploadedMetadata = {
      ...validMetadata,
      status: Status.UPLOADED,
      uuid: "ca2b8ff0-c7e4-427f-894a-e6cf1ff2b8d1",
      createdAt: now,
      updatedAt: now,
    };
    await instrumentRepo.save(uploadedMetadata);
    await expect(axios.post(metadataUrl, validMetadata, { headers })).rejects.toMatchObject({
      response: { status: 409 },
    });
    const md = await instrumentRepo.findOne({ checksum: validMetadata.checksum });
    return expect(new Date(md.updatedAt).getTime()).toEqual(now.getTime());
  });

  test("responds with 409 on existing hashsum with allowUpdate=True and instrument data", async () => {
    const now = new Date();
    const uploadedMetadata = {
      ...validMetadata,
      status: Status.UPLOADED,
      uuid: "ca2b8ff0-c7e4-427f-894a-e6cf1ff2b8d1",
      allowUpdate: true,
      createdAt: now,
      updatedAt: now,
    };
    const newUpload = { ...validMetadata, allowUpdate: true };
    await instrumentRepo.save(uploadedMetadata);
    await expect(axios.post(metadataUrl, newUpload, { headers })).rejects.toMatchObject({ response: { status: 409 } });
    const md = await instrumentRepo.findOne({ checksum: uploadedMetadata.checksum });
    return expect(new Date(md.updatedAt).getTime()).toEqual(now.getTime());
  });

  test("responds with 422 on missing filename", async () => {
    const payload = { ...validMetadata, filename: undefined };
    return expect(axios.post(metadataUrl, payload, { headers })).rejects.toMatchObject({ response: { status: 422 } });
  });

  test("responds with 422 on missing measurementDate", async () => {
    const payload = { ...validMetadata, measurementDate: undefined };
    return expect(axios.post(metadataUrl, payload, { headers })).rejects.toMatchObject({ response: { status: 422 } });
  });

  test("responds with 422 on invalid measurementDate", async () => {
    const payload = { ...validMetadata, measurementDate: "July" };
    return expect(axios.post(metadataUrl, payload, { headers })).rejects.toMatchObject({ response: { status: 422 } });
  });

  test("responds with 422 on missing checksum", async () => {
    const payload = { ...validMetadata, checksum: undefined };
    return expect(axios.post(metadataUrl, payload, { headers })).rejects.toMatchObject({ response: { status: 422 } });
  });

  test("responds with 422 on invalid checksum", async () => {
    const payload = { ...validMetadata, checksum: "293948" };
    return expect(axios.post(metadataUrl, payload, { headers })).rejects.toMatchObject({ response: { status: 422 } });
  });

  test("responds with 422 on missing instrument", async () => {
    const payload = { ...validMetadata, instrument: undefined };
    return expect(axios.post(metadataUrl, payload, { headers })).rejects.toMatchObject({ response: { status: 422 } });
  });

  test("responds with 422 on invalid instrument", async () => {
    const payload = { ...validMetadata, instrument: "kukko" };
    return expect(axios.post(metadataUrl, payload, { headers })).rejects.toMatchObject({ response: { status: 422 } });
  });

  //test('responds with 400 on missing site', async () => {
  //  const payload = {...validMetadata, site: undefined}
  //  return expect(axios.post(metadataUrl, payload)).rejects.toMatchObject({ response: { status: 400}})
  //})
  test("responds with 401 on missing authentication", async () => {
    const payload = { ...validMetadata, site: undefined };
    return expect(axios.post(metadataUrl, payload)).rejects.toMatchObject({ response: { status: 401 } });
  });

  //test('responds with 422 on invalid site', async () => {
  //  const badHeaders = {'authorization':  `Basic ${str2base64('espoo:lol')}`}
  //  return expect(axios.post(metadataUrl, validMetadata, {headers: badHeaders})).rejects
  //    .toMatchObject({ response: { status: 422}})
  //})
  test("responds with 401 on non-existent username", async () => {
    const badHeaders = { authorization: `Basic ${str2base64("espoo:lol")}` };
    return expect(axios.post(metadataUrl, validMetadata, { headers: badHeaders })).rejects.toMatchObject({
      response: { status: 401 },
    });
  });
});

describe("PUT /upload/data/:checksum", () => {
  const validUrl = `${dataUrl}${validMetadata.checksum}`;
  const validFile = "content";

  beforeEach(async () => {
    await instrumentRepo.delete({});
    return await axios.post(metadataUrl, validMetadata, { headers });
  });

  test("responds with 201 on submitting new file", async () => {
    await expect(axios.put(validUrl, validFile, { headers })).resolves.toMatchObject({ status: 201 });
    const md = await instrumentRepo.findOne({ checksum: validMetadata.checksum });
    expect(new Date(md.updatedAt).getTime()).toBeGreaterThan(new Date(md.createdAt).getTime());
    return expect(md.status).toEqual(Status.UPLOADED);
  });

  test("responds with 200 on submitting existing file", async () => {
    await axios.put(validUrl, validFile, { headers });
    const md1 = await instrumentRepo.findOne({ checksum: validMetadata.checksum });
    await expect(axios.put(validUrl, validFile, { headers })).resolves.toMatchObject({ status: 200 });
    const md2 = await instrumentRepo.findOne({ checksum: validMetadata.checksum });
    return expect(new Date(md1.updatedAt).getTime()).toEqual(new Date(md2.updatedAt).getTime());
  });

  test("saves correct file size", async () => {
    await axios.put(validUrl, validFile, { headers });
    const md = await instrumentRepo.findOne({ checksum: validMetadata.checksum });
    return expect(md.size).toBe(validFile.length + ""); // eslint-disable-line prefer-template
  });

  test("responds with 400 on invalid hash", async () => {
    const url = `${dataUrl}file1.lv1`;
    return expect(axios.put(url, validFile, { headers })).rejects.toMatchObject({ response: { status: 400 } });
  });

  test("responds with 400 on incorrect hash", async () => {
    const invalidFile = "invalidhash";
    return expect(axios.put(validUrl, invalidFile, { headers })).rejects.toMatchObject({ response: { status: 400 } });
  });

  test("responds with 500 on internal errors", async () => {
    const invalidFile = "servererr";
    return expect(axios.put(validUrl, invalidFile, { headers })).rejects.toMatchObject({ response: { status: 500 } });
  });

  test("responds with 422 on nonexistent hash", async () => {
    const url = `${dataUrl}9a0364b9e99bb480dd25e1f0284c8554`;
    return expect(axios.put(url, validFile, { headers })).rejects.toMatchObject({ response: { status: 422 } });
  });

  test("responds with 401 when submitting data with wrong credentials", async () => {
    const now = new Date();
    const headers = { authorization: `Basic ${str2base64("martinlaakso:lol")}` };
    await expect(axios.put(validUrl, validFile, { headers })).rejects.toMatchObject({ response: { status: 401 } });
    const md = await instrumentRepo.findOne({ checksum: validMetadata.checksum });
    return expect(new Date(md.updatedAt).getTime()).toBeLessThan(now.getTime());
  });
});

describe("PUT /model-upload/data/:checksum", () => {
  const headers = { authorization: `Basic ${str2base64("bob:bobs_pass")}` };
  beforeEach(async () => {
    await modelRepo.delete({});
    return axios.post(modelMetadataUrl, validModelMetadata, { headers });
  });

  test("responds with 201 on submitting new file", async () => {
    const validModelUrl = `${modelDataUrl}${validModelMetadata.checksum}`;
    const validFile = "content";
    await expect(axios.put(validModelUrl, validFile, { headers })).resolves.toMatchObject({ status: 201 });
    const md = await modelRepo.findOne({ checksum: validModelMetadata.checksum });
    return expect(md.status).toEqual(Status.UPLOADED);
  });
});

describe("POST /model-upload/metadata", () => {
  const headers = { authorization: `Basic ${str2base64("bob:bobs_pass")}` };
  const metaData = {
    filename: "20200122_bucharest_icon-iglo-12-23.nc",
    measurementDate: "2020-01-22",
    checksum: "30b725f10c9c85c70d97880dfe8191b3",
    model: "icon-iglo-12-23",
    site: "bucharest",
  };

  beforeEach(async () => {
    await modelRepo.delete({});
  });

  //test('responds with 409 if stable file exists', async () => {
  //  return expect(axios.post(modelMetadataUrl, metaData, {headers})).rejects.toMatchObject({ response: { status: 409}})
  //})

  test("inserts metadata if volatile file exists", async () => {
    const payload = { ...metaData, measurementDate: "2020-05-12" };
    await expect(axios.post(modelMetadataUrl, payload, { headers })).resolves.toMatchObject({ status: 200 });
    return await modelRepo.findOneOrFail({ checksum: metaData.checksum });
  });

  test("inserts new metadata and takes site from metadata", async () => {
    await expect(axios.post(modelMetadataUrl, validModelMetadata, { headers })).resolves.toMatchObject({ status: 200 });
    const md = await modelRepo.findOne({ checksum: validModelMetadata.checksum }, { relations: ["site", "model"] });
    return expect(md.site.id).toBe(validModelMetadata.site);
  });

  test("updates metadata submitted with allowUpdate flag", async () => {
    const payload = { ...validMetadata, instrument: undefined, allowUpdate: true, model: "ecmwf" };
    await expect(axios.post(modelMetadataUrl, payload, { headers })).resolves.toMatchObject({ status: 200 });
    const md = await modelRepo.findOne({ checksum: payload.checksum });
    await modelRepo.update(md.uuid, { updatedAt: "2020-11-07" });
    const payloadResub = { ...payload, checksum: "ac5c1f6c923cc8b259c2e22c7b258ee4" };
    await expect(axios.post(modelMetadataUrl, payloadResub, { headers })).resolves.toMatchObject({ status: 200 });
    const mdResub = await modelRepo.findOne(md.uuid);
    return expect(mdResub.checksum).toBe(payloadResub.checksum);
  });

  test("responds with 409 on existing hashsum with allowUpdate=True", async () => {
    const now = new Date();
    const uploadedMetadata = {
      ...validMetadata,
      status: Status.UPLOADED,
      uuid: "ca2b8ff0-c7e4-427f-894a-e6cf1ff2b8d2",
      allowUpdate: true,
      model: "ecmwf",
      createdAt: now,
      updatedAt: now,
      instrument: undefined,
    };
    const newUpload = { ...validMetadata, allowUpdate: true, model: "ecmwf", instrument: undefined };
    await modelRepo.save(uploadedMetadata);
    await expect(axios.post(modelMetadataUrl, newUpload, { headers })).rejects.toMatchObject({
      response: { status: 409 },
    });
    const md = await modelRepo.findOne({ checksum: uploadedMetadata.checksum });
    return expect(new Date(md.updatedAt).getTime()).toEqual(now.getTime());
  });

  test("responds with 422 on missing model", async () => {
    const payload = { ...validModelMetadata, model: undefined };
    return expect(axios.post(modelMetadataUrl, payload, { headers })).rejects.toMatchObject({
      response: { status: 422 },
    });
  });

  test("responds with 422 on invalid model", async () => {
    const payload = { ...validModelMetadata, model: "kukko" };
    return expect(axios.post(modelMetadataUrl, payload, { headers })).rejects.toMatchObject({
      response: { status: 422 },
    });
  });

  test("responds with 422 on empty model", async () => {
    const payload = { ...validModelMetadata, model: "" };
    return expect(axios.post(modelMetadataUrl, payload, { headers })).rejects.toMatchObject({
      response: { status: 422 },
    });
  });

  test("responds with 400 on missing site", async () => {
    const payload = { ...validModelMetadata, site: undefined };
    return expect(axios.post(modelMetadataUrl, payload, { headers })).rejects.toMatchObject({
      response: { status: 400 },
    });
  });

  test("responds with 422 on empty site", async () => {
    const payload = { ...validModelMetadata, site: "" };
    return expect(axios.post(modelMetadataUrl, payload, { headers })).rejects.toMatchObject({
      response: { status: 422 },
    });
  });

  test("responds with 422 on invalid site", async () => {
    const payload = { ...validModelMetadata, site: "aksjdfksdf" };
    return expect(axios.post(modelMetadataUrl, payload, { headers })).rejects.toMatchObject({
      response: { status: 422 },
    });
  });
});

describe("POST /upload-metadata/", () => {
  let uuid: string;

  beforeAll(async () => {
    await axios.post(metadataUrl, validMetadata, { headers });
    const { data } = await axios.get(publicMetadataUrl, { params: { developer: true } });
    uuid = data[0].uuid;
  });

  test("updates status", async () => {
    await expect(axios.post(privateMetadataUrl, { uuid, status: Status.PROCESSED })).resolves.toMatchObject({
      status: 200,
    });
    return expect(instrumentRepo.findOne(uuid)).resolves.toMatchObject({ status: Status.PROCESSED });
  });

  test("updates status to invalid", async () => {
    await expect(axios.post(privateMetadataUrl, { uuid, status: "invalid" })).resolves.toMatchObject({ status: 200 });
    return expect(instrumentRepo.findOne(uuid)).resolves.toMatchObject({ status: "invalid" });
  });
});

describe("test content upload", () => {
  const headers = { authorization: `Basic ${str2base64("alice:alices_password")}` };
  const validMetadata = {
    filename: "file1.LV1",
    measurementDate: "2020-08-11",
    checksum: "9a0364b9e99bb480dd25e1f0284c8555",
    instrument: "mira",
    site: "granada",
  };
  const content = "content";
  beforeAll(async () => {
    await initUsersAndPermissions();
  });
  afterAll(async () => {
    await Promise.all([instrumentRepo.delete({})]);
  });
  beforeEach(async () => {
    await instrumentRepo.delete({});
    return;
  });
  it("tests content upload", async () => {
    await expect(axios.post(metadataUrl, validMetadata, { headers })).resolves.toMatchObject({ status: 200 });
    const checksum = validMetadata.checksum;
    const postDataUrl = dataUrl.concat(checksum);
    await expect(axios.put(postDataUrl, content, { headers })).resolves.toMatchObject({ status: 201 });
    const metadata = await instrumentRepo.findOne({ checksum: checksum });
    expect(new Date(metadata.updatedAt).getTime()).toBeGreaterThan(new Date(metadata.createdAt).getTime());
  });
});

describe("test user permissions", () => {
  beforeAll(async () => {
    await initUsersAndPermissions();
  });
  afterAll(async () => {
    await Promise.all([instrumentRepo.delete({})]);
  });
  beforeEach(async () => {
    await instrumentRepo.delete({});
    await modelRepo.delete({});
    return;
  });

  it("tests that alice can upload to all sites", async () => {
    const sites: any[] = (await axios.get(backendPublicUrl.concat("sites"))).data;
    for (const site of sites) {
      await expectSuccessfulUploadInstrument("alice", "alices_password", site.id);
      await expectFailedUploadModel("alice", "alices_password", site.id);
    }
  });
  it("tests that bob can upload model to all sites", async () => {
    const sites: any[] = (await axios.get(backendPublicUrl.concat("sites"))).data;
    for (const site of sites) {
      await expectSuccessfulUploadModel("bob", "bobs_pass", site.id);
      await expectFailedUploadInstrument("bob", "bobs_pass", site.id);
    }
  });
  it("tests that carol can upload only to bucharest and mace-head", async () => {
    const sites: any[] = (await axios.get(backendPublicUrl.concat("sites"))).data;
    for (const site of sites) {
      if (["bucharest", "mace-head"].includes(site.id)) {
        await expectSuccessfulUploadInstrument("carol", "carols-passphrase", site.id);
      } else {
        await expectFailedUploadInstrument("carol", "carols-passphrase", site.id);
      }
    }
  });
  it("tests that david can upload only model to granada and  instrument to mace-head", async () => {
    const sites: any[] = (await axios.get(backendPublicUrl.concat("sites"))).data;
    for (const site of sites) {
      if (site.id === "granada") {
        await expectSuccessfulUploadModel("david", "davids^passphrase", site.id);
        await expectFailedUploadInstrument("david", "davids^passphrase", site.id);
      } else if (site.id === "mace-head") {
        await expectSuccessfulUploadInstrument("david", "davids^passphrase", site.id);
        await expectFailedUploadModel("david", "davids^passphrase", site.id);
      } else {
        await expectFailedUploadInstrument("david", "davids^passphrase", site.id);
        await expectFailedUploadModel("david", "davids^passphrase", site.id);
      }
    }
  });
  it("tests that bucharest can upload only to bucharest", async () => {
    const sites: any[] = (await axios.get(backendPublicUrl.concat("sites"))).data;
    for (const site of sites) {
      if (site.id === "bucharest") {
        await expectSuccessfulUploadInstrument("bucharest", "passWordForBucharest", site.id);
        await expectFailedUploadModel("bucharest", "passWordForBucharest", site.id);
      } else {
        await expectFailedUploadInstrument("bucharest", "passWordForBucharest", site.id);
        await expectFailedUploadModel("bucharest", "passWordForBucharest", site.id);
      }
    }
  });
  it("tests that granada can upload only to granada", async () => {
    const sites: any[] = (await axios.get(backendPublicUrl.concat("sites"))).data;
    for (const site of sites) {
      if (site.id === "granada") {
        await expectSuccessfulUploadInstrument("granada", "PASSWORDFORgranada", site.id);
        await expectFailedUploadModel("granada", "PASSWORDFORgranada", site.id);
      } else {
        await expectFailedUploadInstrument("granada", "PASSWORDFORgranada", site.id);
        await expectFailedUploadModel("granada", "PASSWORDFORgranada", site.id);
      }
    }
  });
  it("tests that mace-head can upload only to mace-head", async () => {
    const sites: any[] = (await axios.get(backendPublicUrl.concat("sites"))).data;
    for (const site of sites) {
      if (site.id === "mace-head") {
        await expectSuccessfulUploadInstrument("mace-head", "SfSCHhnU5cjrMiLdgcW3ixkTQRo", site.id);
        await expectFailedUploadModel("mace-head", "SfSCHhnU5cjrMiLdgcW3ixkTQRo", site.id);
      } else {
        await expectFailedUploadInstrument("mace-head", "SfSCHhnU5cjrMiLdgcW3ixkTQRo", site.id);
        await expectFailedUploadModel("mace-head", "SfSCHhnU5cjrMiLdgcW3ixkTQRo", site.id);
      }
    }
  });

  it("tests that eve cannot upload anywhere", async () => {
    const sites: any[] = (await axios.get(backendPublicUrl.concat("sites"))).data;
    for (const site of sites) {
      await expectFailedUploadInstrument("eve", "eves_passphraase", site.id);
      await expectFailedUploadModel("eve", "eves_passphraase", site.id);
    }
  });
  it("tests that users cannot upload with wrong passwords", async () => {
    const user_accounts_url = `${backendPrivateUrl}user-accounts`;
    const sites: any[] = (await axios.get(backendPublicUrl.concat("sites"))).data;
    const users: any[] = (await axios.get(user_accounts_url)).data;
    for (const site of sites) {
      for (const user of users) {
        const length = randomInt(1, 512);
        const randomPassword = crypto.randomBytes(length).toString("hex");
        await expectFailedUploadInstrument(user.username, randomPassword, site.id, false);
        await expectFailedUploadModel(user.username, randomPassword, site.id, false);
        await expectFailedUploadInstrument(user.username, "", site.id, false);
        await expectFailedUploadModel(user.username, "", site.id, false);
      }
    }
  });
  it("tests that users cannot use others passwords", async () => {
    const sites: any[] = (await axios.get(backendPublicUrl.concat("sites"))).data;
    for (const site of sites) {
      for (const usernameA of Object.keys(userCredentials)) {
        for (const [usernameB, passwordB] of Object.entries(userCredentials)) {
          if (usernameA == usernameB) {
            continue;
          }
          await expectFailedUploadInstrument(usernameA, passwordB, site.id, false);
          await expectFailedUploadModel(usernameA, passwordB, site.id, false);
        }
      }
    }
  }, 40000);
  it("tests that nonexistent users cannot upload with correct or incorrect passwords", async () => {
    const sites: any[] = (await axios.get(backendPublicUrl.concat("sites"))).data;
    const usernameLength = randomInt(1, 512);
    const randomUsername = crypto.randomBytes(usernameLength).toString("hex");
    for (const site of sites) {
      for (const password of Object.values(userCredentials)) {
        // Random username, some correct password
        await expectFailedUploadInstrument(randomUsername, password, site.id, false);
        await expectFailedUploadModel(randomUsername, password, site.id, false);
        // Random username, some random password
        const passwordLength = randomInt(1, 512);
        const randomPassword = crypto.randomBytes(passwordLength).toString("hex");
        await expectFailedUploadInstrument(randomUsername, randomPassword, site.id, false);
        await expectFailedUploadModel(randomUsername, randomPassword, site.id, false);
        // Empty password
        await expectFailedUploadInstrument(randomUsername, "", site.id, false);
        await expectFailedUploadModel(randomUsername, "", site.id, false);
        // empty username
        await expectFailedUploadInstrument("", password, site.id, false);
        await expectFailedUploadModel("", password, site.id, false);
        await expectFailedUploadInstrument("", "", site.id, false);
        await expectFailedUploadModel("", "", site.id, false);
      }
    }
  });
});

async function expectSuccessfulUploadInstrument(username: string, password: string, siteId: string) {
  const contentLength = randomInt(4, 128);
  const content = crypto.randomBytes(contentLength).toString("hex");
  const checksum = md5(content);
  const postMetadata = {
    filename: "file1.LV1",
    measurementDate: "2020-08-11",
    instrument: "mira",
    checksum: checksum,
    site: siteId,
  };
  const credentials = username.concat(":", password);
  const headers = { authorization: `Basic ${str2base64(credentials)}` };
  const timeBeforePost = new Date();
  // POST metadata
  await expect(axios.post(metadataUrl, postMetadata, { headers })).resolves.toMatchObject({ status: 200 });
  const metadataFromDb = await instrumentRepo.findOne({ checksum: checksum });
  expect(metadataFromDb).toBeTruthy();
  expect(new Date(metadataFromDb.createdAt).getTime()).toBeGreaterThan(timeBeforePost.getTime());
  expect(new Date(metadataFromDb.updatedAt).getTime()).toEqual(new Date(metadataFromDb.createdAt).getTime());
  expect(metadataFromDb.status).toEqual(Status.CREATED);
  // PUT data
  const putDataUrl = dataUrl.concat(checksum);
  await expect(axios.put(putDataUrl, content, { headers })).resolves.toMatchObject({ status: 201 });
  const metadataFromDbAfterPut = await instrumentRepo.findOne({ checksum: checksum });
  expect(new Date(metadataFromDbAfterPut.updatedAt).getTime()).toBeGreaterThan(
    new Date(metadataFromDbAfterPut.createdAt).getTime()
  );
}

async function expectFailedUploadInstrument(
  username: string,
  password: string,
  siteId: string,
  correctPassword: boolean = true
) {
  const putStatus: number = correctPassword ? 422 : 401;
  const contentLength = randomInt(4, 128);
  const content = crypto.randomBytes(contentLength).toString("hex");
  const checksum = md5(content);
  const postMetadata = {
    filename: "file1.LV1",
    measurementDate: "2020-08-11",
    instrument: "mira",
    checksum: checksum,
    site: siteId,
  };
  const credentials = username.concat(":", password);
  const headers = { authorization: `Basic ${str2base64(credentials)}` };
  // POST metadata
  await expect(axios.post(metadataUrl, postMetadata, { headers })).rejects.toMatchObject({ response: { status: 401 } });
  // PUT data
  const putDataUrl = dataUrl.concat(checksum);
  await expect(axios.put(putDataUrl, content, { headers })).rejects.toMatchObject({ response: { status: putStatus } });
  await expect(instrumentRepo.findOne({ checksum: checksum })).resolves.toBeUndefined();
}

async function expectSuccessfulUploadModel(username: string, password: string, siteId: string) {
  const contentLength = randomInt(4, 128);
  const content = crypto.randomBytes(contentLength).toString("hex");
  const checksum = md5(content);
  const postMetadata = {
    filename: "20200122_".concat(siteId, "_icon-iglo-12-23.nc"),
    measurementDate: "2020-08-11",
    model: "icon-iglo-12-23",
    checksum: checksum,
    site: siteId,
  };
  const credentials = username.concat(":", password);
  const headers = { authorization: `Basic ${str2base64(credentials)}` };

  // POST metadata
  const timeBeforePost = new Date().getTime();
  await expect(axios.post(modelMetadataUrl, postMetadata, { headers })).resolves.toMatchObject({ status: 200 });
  const metadata = await modelRepo.findOne({ checksum: postMetadata.checksum }, { relations: ["site", "model"] });
  const timeCreated = new Date(metadata.createdAt).getTime();
  expect(metadata.site.id).toEqual(siteId);
  expect(timeCreated).toBeGreaterThan(timeBeforePost);
  // PUT data
  const timeBeforePut = new Date().getTime();
  const putDataUrl = modelDataUrl.concat(checksum);
  await expect(axios.put(putDataUrl, content, { headers })).resolves.toMatchObject({ status: 201 });
  const metadataAfterPut = await modelRepo.findOne(
    { checksum: postMetadata.checksum },
    { relations: ["site", "model"] }
  );
  const timeUpdated = new Date(metadataAfterPut.updatedAt).getTime();
  expect(timeUpdated).toBeGreaterThan(timeBeforePut);
}

async function expectFailedUploadModel(
  username: string,
  password: string,
  siteId: string,
  correctPassword: boolean = true
) {
  const putStatus: number = correctPassword ? 422 : 401;
  const contentLength = randomInt(4, 128);
  const content = crypto.randomBytes(contentLength).toString("hex");
  const checksum = md5(content);
  const postMetadata = {
    filename: "20200122_".concat(siteId, "_icon-iglo-12-23.nc"),
    measurementDate: "2020-08-11",
    model: "icon-iglo-12-23",
    checksum: checksum,
    site: siteId,
  };
  const credentials = username.concat(":", password);
  const headers = { authorization: `Basic ${str2base64(credentials)}` };

  // POST metadata
  await expect(axios.post(modelMetadataUrl, postMetadata, { headers })).rejects.toMatchObject({
    response: { status: 401 },
  });
  // PUT data
  const putDataUrl = modelDataUrl.concat(checksum);
  await expect(axios.put(putDataUrl, content, { headers })).rejects.toMatchObject({ response: { status: putStatus } });
  await expect(modelRepo.findOne({ checksum: checksum })).resolves.toBeUndefined();
}
function randomInt(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function md5(str: string) {
  return crypto.createHash("md5").update(str).digest("hex");
}