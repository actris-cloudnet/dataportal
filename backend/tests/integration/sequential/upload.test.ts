import axios from "axios";
import { DataSource, Repository } from "typeorm";
import { backendPrivateUrl, backendPublicUrl, genResponse, str2base64 } from "../../lib";
import { InstrumentUpload, ModelUpload, Status } from "../../../src/entity/Upload";
import { promises as fsp } from "node:fs";
import { initUsersAndPermissions } from "../../lib/userAccountAndPermissions";
import { AppDataSource } from "../../../src/data-source";
import { ModelFile, RegularFile } from "../../../src/entity/File";
import { ArrayEqual } from "../../../src/lib";
import { beforeAll, beforeEach, afterAll, describe, it, expect, jest } from "@jest/globals";
import { randomBytes, createHash } from "node:crypto";

jest.setTimeout(20000);

let dataSource: DataSource;
let instrumentRepo: Repository<InstrumentUpload>;
let modelRepo: Repository<ModelUpload>;

const metadataUrl = `${backendPrivateUrl}upload/metadata/`;
const modelMetadataUrl = `${backendPrivateUrl}model-upload/metadata/`;
const publicMetadataUrl = `${backendPublicUrl}raw-files/`;
const privateMetadataUrl = `${backendPrivateUrl}upload-metadata/`;
const dataUrl = `${backendPrivateUrl}upload/data/`;
const modelDataUrl = `${backendPrivateUrl}model-upload/data/`;

const userCredentials = {
  "alice": "alices_password",
  "bob": "bobs_pass",
  "carol": "carols-passphrase",
  "david": "davids^passphrase",
  "eve": "eves_passphraase",
  "bucharest": "passWordForBucharest",
  "granada": "PASSWORDFORgranada",
  "mace-head": "SfSCHhnU5cjrMiLdgcW3ixkTQRo",
};

const validMetadata = {
  filename: "file1.LV1",
  measurementDate: "2020-08-11",
  checksum: "9a0364b9e99bb480dd25e1f0284c8555",
  instrument: "mira-35",
  instrumentPid: "https://hdl.handle.net/123/granada-mira",
  site: "granada",
};

const validMetadataAndStableProduct = {
  filename: "file1.LV1",
  measurementDate: "2021-02-20",
  checksum: "3a0364b9e99bb480dd25e1f0284c8555",
  instrument: "mira-35",
  instrumentPid: "https://hdl.handle.net/123/bucharest-mira",
  site: "bucharest",
};

const validMetadataAndVolatileProduct = {
  filename: "file1.LV1",
  measurementDate: "2018-11-15",
  checksum: "3a0364b9e99bb480dd25e1f0284c8555",
  instrument: "mira-35",
  instrumentPid: "https://hdl.handle.net/123/bucharest-mira",
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
  dataSource = await AppDataSource.initialize();
  instrumentRepo = dataSource.getRepository(InstrumentUpload);
  modelRepo = dataSource.getRepository(ModelUpload);
  // Make sure these tables are initialized correctly
  await dataSource
    .getRepository(ModelFile)
    .save(JSON.parse((await fsp.readFile("fixtures/5-model_file.json")).toString()));
  await dataSource
    .getRepository(RegularFile)
    .save(JSON.parse((await fsp.readFile("fixtures/5-regular_file.json")).toString()));

  await instrumentRepo.createQueryBuilder().delete().execute();
  await modelRepo.createQueryBuilder().delete().execute();
  await initUsersAndPermissions();
});

afterAll(async () => {
  await instrumentRepo.createQueryBuilder().delete().execute();
  await modelRepo.createQueryBuilder().delete().execute();
  await dataSource.destroy();
});

describe("POST /upload/metadata", () => {
  beforeEach(async () => {
    await instrumentRepo.createQueryBuilder().delete().execute();
  });

  it("accepts valid filenames", async () => {
    const validNames = [
      "filename.LV1",
      "/file/name/with/slashes.txt",
      "filename-with-dashes.dat",
      "234234.LV1",
      "filename_with_numbers-and-other-123123-222.txt",
      "filename-without-suffix",
      "/foo?bar/jee*joo/filename.nc",
      "./filename.nc",
      "../filename.nc",
    ];
    for (const validName of validNames) {
      const validMeta = { ...validMetadata, filename: validName };
      await expect(axios.post(metadataUrl, validMeta, { headers })).resolves.toMatchObject({ status: 200 });
    }
  });

  it("rejects invalid filenames", async () => {
    const badNames = [
      "windows\\\\on\\tyhma.LV1",
      "file with.whitespace",
      ".filename.LV1",
      "/foo/bar/.filename.LV1",
      "øäææ.nc",
      "filename😁filename.LV1",
      "ääööö.dat",
      "simosimo?simo",
      "-filename.nc",
      "_filename.nc",
      "filename.nc_",
      "filename.nc-",
      "filename.",
    ];
    for (const badName of badNames) {
      const badMeta = { ...validMetadata, filename: badName };
      await expect(axios.post(metadataUrl, badMeta, { headers })).rejects.toMatchObject({ response: { status: 422 } });
    }
  });

  it("inserts new metadata", async () => {
    const now = new Date();
    await expect(axios.post(metadataUrl, validMetadata, { headers })).resolves.toMatchObject({ status: 200 });
    const md = await instrumentRepo.findOneByOrFail({ checksum: validMetadata.checksum });
    expect(md).toBeTruthy();
    expect(new Date(md.createdAt).getTime()).toBeGreaterThan(now.getTime());
    expect(new Date(md.updatedAt).getTime()).toEqual(new Date(md.createdAt).getTime());
    expect(md.status).toEqual(Status.CREATED);
  });

  it("inserts same metadata simultaneously", async () => {
    const now = new Date();
    await Promise.all(
      Array.from({ length: 100 }, () =>
        axios.post(metadataUrl, validMetadata, { headers }).catch(() => {
          /* Let some requests fail. */
        }),
      ),
    );
    const mds = await instrumentRepo.findBy({ checksum: validMetadata.checksum });
    expect(mds).toHaveLength(1);
    expect(new Date(mds[0].createdAt).getTime()).toBeGreaterThan(now.getTime());
    expect(new Date(mds[0].updatedAt).getTime()).toBeGreaterThan(now.getTime());
    expect(mds[0].status).toEqual(Status.CREATED);
  });

  it("replaces metadata on same day simultaneously", async () => {
    const now = new Date();
    const altChecksum = randomMd5();
    await Promise.all(
      Array.from({ length: 100 }, (v, i) =>
        axios
          .post(metadataUrl, i % 2 == 0 ? validMetadata : { ...validMetadata, checksum: altChecksum }, { headers })
          .catch(() => {
            /* Let some requests fail. */
          }),
      ),
    );
    const mds = await instrumentRepo.findBy({
      filename: validMetadata.filename,
      measurementDate: new Date(validMetadata.measurementDate),
      site: { id: validMetadata.site },
    });
    expect(mds).toHaveLength(1);
    expect(new Date(mds[0].createdAt).getTime()).toBeGreaterThan(now.getTime());
    expect(new Date(mds[0].updatedAt).getTime()).toBeGreaterThan(now.getTime());
    expect(mds[0].status).toEqual(Status.CREATED);
  });

  it("rejects metadata without instrumentPid", async () => {
    const payload = { ...validMetadata, instrumentPid: undefined };
    await expect(axios.post(metadataUrl, payload, { headers })).rejects.toMatchObject(
      genResponse(422, "Request is missing instrumentPid"),
    );
  });

  it("rejects metadata with invalid instrumentPid type", async () => {
    const payload = { ...validMetadata, instrumentPid: 123 };
    await expect(axios.post(metadataUrl, payload, { headers })).rejects.toMatchObject(
      genResponse(422, "instrumentPid must be string"),
    );
  });

  it("rejects metadata with invalid instrumentPid", async () => {
    const payload = { ...validMetadata, instrumentPid: "kissa" };
    await expect(axios.post(metadataUrl, payload, { headers })).rejects.toMatchObject(
      genResponse(422, "instrumentPid must be HTTPS"),
    );
  });

  it("rejects metadata with instrument landing page", async () => {
    const payload = {
      ...validMetadata,
      instrumentPid: "https://instrumentdb.out.ocp.fmi.fi/instrument/141063a2-67b7-47ee-b97c-7d814d33e68a",
    };
    await expect(axios.post(metadataUrl, payload, { headers })).rejects.toMatchObject(
      genResponse(422, "instrumentPid must be Handle"),
    );
  });

  it("rejects metadata with HTTP instrumentPid", async () => {
    const payload = { ...validMetadata, instrumentPid: "http://hdl.handle.net/21.12132/3.191564170f8a4686" };
    await expect(axios.post(metadataUrl, payload, { headers })).rejects.toMatchObject(
      genResponse(422, "instrumentPid must be HTTPS"),
    );
  });

  it("rejects metadata with non-existing instrumentPid", async () => {
    const payload = {
      ...validMetadata,
      instrument: "hatpro",
      instrumentPid: "https://hdl.handle.net/123/bucharest-katti",
    };
    await expect(axios.post(metadataUrl, payload, { headers })).rejects.toMatchObject(
      genResponse(422, "Unknown instrument PID"),
    );
  });

  it("rejects metadata with mismatching instrument and instrumentPid", async () => {
    const payload = {
      ...validMetadata,
      instrument: "hatpro",
      instrumentPid: "https://hdl.handle.net/123/bucharest-chm15k",
    };
    await expect(axios.post(metadataUrl, payload, { headers })).rejects.toMatchObject(
      genResponse(422, "Instrument doesn't match instrument PID"),
    );
  });

  it("inserts new metadata containing instrumentPid", async () => {
    const payload = validMetadata;
    await expect(axios.post(metadataUrl, payload, { headers })).resolves.toMatchObject({ status: 200 });
    const file = await instrumentRepo.findOneOrFail({
      where: { instrumentInfo: { pid: payload.instrumentPid } },
      relations: { instrumentInfo: true },
    });
    expect(file.instrumentInfo).toMatchObject({
      uuid: "9e0f4b27-d5f3-40ad-8b73-2ae5dabbf81f",
      pid: "https://hdl.handle.net/123/granada-mira",
    });
  });

  it("inserts similar metadata with different instrumentPids", async () => {
    const metadata1 = {
      ...validMetadata,
      instrumentPid: "https://hdl.handle.net/123/bucharest-mira",
      checksum: randomMd5(),
    };
    const metadata2 = {
      ...validMetadata,
      instrumentPid: "https://hdl.handle.net/123/granada-mira",
      checksum: randomMd5(),
    };
    await expect(axios.post(metadataUrl, metadata1, { headers })).resolves.toMatchObject({ status: 200 });
    await expect(axios.post(metadataUrl, metadata2, { headers })).resolves.toMatchObject({ status: 200 });
    const md1 = await instrumentRepo.findOneOrFail({
      where: { checksum: metadata1.checksum },
      relations: { instrumentInfo: true },
    });
    expect(md1.status).toEqual(Status.CREATED);
    expect(md1.instrumentInfo.pid).toEqual(metadata1.instrumentPid);
    const md2 = await instrumentRepo.findOneOrFail({
      where: { checksum: metadata2.checksum },
      relations: { instrumentInfo: true },
    });
    expect(md2.status).toEqual(Status.CREATED);
    expect(md2.instrumentInfo.pid).toEqual(metadata2.instrumentPid);
  });

  it("inserts new metadata with the current date as measurementDate", async () => {
    const today = new Date().toISOString().slice(0, 10);
    const payload = { ...validMetadata, measurementDate: today };
    await expect(axios.post(metadataUrl, payload, { headers })).resolves.toMatchObject({ status: 200 });
  });

  it("responds with 422 on measurementDate in the future", async () => {
    const payload = { ...validMetadata, measurementDate: "2032-01-01" };
    await expect(axios.post(metadataUrl, payload, { headers })).rejects.toMatchObject({ response: { status: 422 } });
  });

  it("inserts new halo upload metadata containing instrumentPid", async () => {
    const payload = {
      ...validMetadata,
      instrument: "halo-doppler-lidar",
      instrumentPid: "https://hdl.handle.net/123/warsaw-halo",
    };
    await expect(axios.post(metadataUrl, payload, { headers })).resolves.toMatchObject({ status: 200 });
    await instrumentRepo.findOneByOrFail({ instrumentInfo: { pid: payload.instrumentPid } });
  });

  it("inserts new metadata if different date", async () => {
    const payload = { ...validMetadata };
    await expect(axios.post(metadataUrl, payload, { headers })).resolves.toMatchObject({ status: 200 });
    const payloadResub = { ...payload, measurementDate: "2020-08-12", checksum: "ac5c1f6c923cc8b259c2e22c7b258ee4" };
    await expect(axios.post(metadataUrl, payloadResub, { headers })).resolves.toMatchObject({ status: 200 });
    await instrumentRepo.findOneByOrFail({ checksum: payload.checksum });
    await instrumentRepo.findOneByOrFail({ checksum: payloadResub.checksum });
  });

  it("inserts new metadata if different filename", async () => {
    const payload = { ...validMetadata };
    await expect(axios.post(metadataUrl, payload, { headers })).resolves.toMatchObject({ status: 200 });
    const payloadResub = { ...payload, filename: "random_results.nc", checksum: "ac5c1f6c923cc8b259c2e22c7b258ee4" };
    await expect(axios.post(metadataUrl, payloadResub, { headers })).resolves.toMatchObject({ status: 200 });
    await instrumentRepo.findOneByOrFail({ checksum: payload.checksum });
    await instrumentRepo.findOneByOrFail({ checksum: payloadResub.checksum });
  });

  it("inserts new metadata if different instrument", async () => {
    const payload = { ...validMetadata };
    await expect(axios.post(metadataUrl, payload, { headers })).resolves.toMatchObject({ status: 200 });
    const payloadResub = {
      ...payload,
      instrumentPid: "https://hdl.handle.net/123/bucharest-chm15k",
      instrument: "chm15k",
      checksum: "ac5c1f6c923cc8b259c2e22c7b258ee4",
    };
    await expect(axios.post(metadataUrl, payloadResub, { headers })).resolves.toMatchObject({ status: 200 });
    await instrumentRepo.findOneByOrFail({ checksum: payload.checksum });
    await instrumentRepo.findOneByOrFail({ checksum: payloadResub.checksum });
  });

  it("inserts new metadata for halo upload", async () => {
    const now = new Date();
    const payload = {
      ...validMetadata,
      instrumentPid: "https://hdl.handle.net/123/warsaw-halo",
      instrument: "halo-doppler-lidar",
    };
    await expect(axios.post(metadataUrl, payload, { headers })).resolves.toMatchObject({ status: 200 });
    const md = await instrumentRepo.findOneByOrFail({ checksum: validMetadata.checksum });
    expect(md).toBeTruthy();
    expect(new Date(md.createdAt).getTime()).toBeGreaterThan(now.getTime());
    expect(new Date(md.updatedAt).getTime()).toEqual(new Date(md.createdAt).getTime());
    expect(md.status).toEqual(Status.CREATED);
  });

  it("updates existing metadata", async () => {
    const payload = { ...validMetadata };
    const expectedResponse = { status: 200, data: "OK" };
    await expect(axios.post(metadataUrl, payload, { headers })).resolves.toMatchObject(expectedResponse);
    const md = await instrumentRepo.findOneByOrFail({ checksum: payload.checksum });
    expect(md.checksum).toBe(validMetadata.checksum);
    const initialTime = new Date(md.updatedAt).getTime();
    const payloadResub = { ...payload, checksum: "ac5c1f6c923cc8b259c2e22c7b258ee4" };
    await expect(axios.post(metadataUrl, payloadResub, { headers })).resolves.toMatchObject(expectedResponse);
    await expect(instrumentRepo.existsBy({ checksum: payload.checksum })).resolves.toBe(false);
    const mdResub = await instrumentRepo.findOneByOrFail({ uuid: md.uuid });
    expect(mdResub.checksum).toBe(payloadResub.checksum);
    const ResubTime = new Date(mdResub.updatedAt).getTime();
    expect(ResubTime).toBeGreaterThan(initialTime);
  });

  it("updates existing metadata if stable product", async () => {
    const headers = { authorization: `Basic ${str2base64("bucharest:passWordForBucharest")}` };
    const payload = { ...validMetadataAndStableProduct };
    await expect(axios.post(metadataUrl, payload, { headers })).resolves.toMatchObject({ status: 200 });
    const payloadResub = { ...payload, checksum: "ac5c1f6c923cc8b259c2e22c7b258ee4" };
    await expect(axios.post(metadataUrl, payloadResub, { headers })).resolves.toMatchObject({ status: 200 });
    await instrumentRepo.findOneByOrFail({ checksum: payloadResub.checksum });
    await expect(instrumentRepo.existsBy({ checksum: payload.checksum })).resolves.toBe(false);
  });

  it("updates existing metadata if volatile product", async () => {
    const headers = { authorization: `Basic ${str2base64("mace-head:SfSCHhnU5cjrMiLdgcW3ixkTQRo")}` };
    const payload = { ...validMetadataAndVolatileProduct };
    await expect(axios.post(metadataUrl, payload, { headers })).resolves.toMatchObject({ status: 200 });
    const payloadResub = { ...payload, checksum: "ac5c1f6c923cc8b259c2e22c7b258ee4" };
    await expect(axios.post(metadataUrl, payloadResub, { headers })).resolves.toMatchObject({ status: 200 });
    await instrumentRepo.findOneByOrFail({ checksum: payloadResub.checksum });
    await expect(instrumentRepo.existsBy({ checksum: payload.checksum })).resolves.toBe(false);
  });

  it("updates existing metadata with allowUpdate = true", async () => {
    const payload = { ...validMetadata, allowUpdate: true };
    const expectedResponse = { status: 200 };
    await expect(axios.post(metadataUrl, payload, { headers })).resolves.toMatchObject(expectedResponse);
    const md = await instrumentRepo.findOneByOrFail({ checksum: payload.checksum });
    expect(md.checksum).toBe(validMetadata.checksum);
    const payloadResub = { ...payload, checksum: "ac5c1f6c923cc8b259c2e22c7b258ee4" };
    await expect(axios.post(metadataUrl, payloadResub, { headers })).resolves.toMatchObject(expectedResponse);
    await expect(instrumentRepo.existsBy({ checksum: payload.checksum })).resolves.toBe(false);
    const mdResub = await instrumentRepo.findOneByOrFail({ uuid: md.uuid });
    expect(mdResub.checksum).toBe(payloadResub.checksum);
  });

  it("updates existing metadata with allowUpdate = false", async () => {
    const payload = { ...validMetadata, allowUpdate: false };
    const expectedResponse = { status: 200 };
    await expect(axios.post(metadataUrl, payload, { headers })).resolves.toMatchObject(expectedResponse);
    const md = await instrumentRepo.findOneByOrFail({ checksum: payload.checksum });
    expect(md.checksum).toBe(validMetadata.checksum);
    const payloadResub = { ...payload, checksum: "ac5c1f6c923cc8b259c2e22c7b258ee4" };
    await expect(axios.post(metadataUrl, payloadResub, { headers })).resolves.toMatchObject(expectedResponse);
    await expect(instrumentRepo.existsBy({ checksum: payload.checksum })).resolves.toBe(false);
    const mdResub = await instrumentRepo.findOneByOrFail({ uuid: md.uuid });
    expect(mdResub.checksum).toBe(payloadResub.checksum);
  });

  it("responds with 200 on existing hashsum with created status", async () => {
    await axios.post(metadataUrl, validMetadata, { headers });
    await expect(axios.post(metadataUrl, validMetadata, { headers })).resolves.toMatchObject({ status: 200 });
  });

  it("responds with 422 if both model and instrument fields are specified", async () => {
    const newMetadata = { ...validMetadata, model: "ecmwf" };
    await expect(axios.post(metadataUrl, newMetadata, { headers })).rejects.toMatchObject({
      response: { status: 422 },
    });
  });

  it("responds with 409 on existing hashsum with uploaded status", async () => {
    const now = new Date();
    const uploadedMetadata = {
      ...validMetadata,
      status: Status.UPLOADED,
      uuid: "ca2b8ff0-c7e4-427f-894a-e6cf1ff2b8d1",
      createdAt: now,
      updatedAt: now,
      instrumentInfo: "9e0f4b27-d5f3-40ad-8b73-2ae5dabbf81f",
    };
    await instrumentRepo.save(uploadedMetadata as any);
    await expect(axios.post(metadataUrl, validMetadata, { headers })).rejects.toMatchObject({
      response: { status: 409 },
    });
    const md = await instrumentRepo.findOneByOrFail({ checksum: validMetadata.checksum });
    expect(new Date(md.updatedAt).getTime()).toEqual(now.getTime());
  });

  it("responds with 409 on existing hashsum with allowUpdate=True and instrument data", async () => {
    const now = new Date();
    const uploadedMetadata = {
      ...validMetadata,
      status: Status.UPLOADED,
      uuid: "ca2b8ff0-c7e4-427f-894a-e6cf1ff2b8d1",
      allowUpdate: true,
      createdAt: now,
      updatedAt: now,
      instrumentInfo: "9e0f4b27-d5f3-40ad-8b73-2ae5dabbf81f",
    };
    const newUpload = { ...validMetadata, allowUpdate: true };
    await instrumentRepo.save(uploadedMetadata as any);
    await expect(axios.post(metadataUrl, newUpload, { headers })).rejects.toMatchObject({ response: { status: 409 } });
    const md = await instrumentRepo.findOneByOrFail({ checksum: uploadedMetadata.checksum });
    expect(new Date(md.updatedAt).getTime()).toEqual(now.getTime());
  });

  it("responds with 422 on missing filename", async () => {
    const payload = { ...validMetadata, filename: undefined };
    await expect(axios.post(metadataUrl, payload, { headers })).rejects.toMatchObject({
      response: { status: 422, data: "Request is missing filename" },
    });
  });

  it("responds with 422 on missing measurementDate", async () => {
    const payload = { ...validMetadata, measurementDate: undefined };
    await expect(axios.post(metadataUrl, payload, { headers })).rejects.toMatchObject({
      response: { status: 422, data: "Request is missing measurementDate or measurementDate is invalid" },
    });
  });

  it("responds with 422 on invalid measurementDate", async () => {
    const payload = { ...validMetadata, measurementDate: "July" };
    await expect(axios.post(metadataUrl, payload, { headers })).rejects.toMatchObject({
      response: { status: 422, data: "Request is missing measurementDate or measurementDate is invalid" },
    });
  });

  it("responds with 422 on missing checksum", async () => {
    const payload = { ...validMetadata, checksum: undefined };
    await expect(axios.post(metadataUrl, payload, { headers })).rejects.toMatchObject({
      response: { status: 422, data: "Request is missing checksum or checksum is invalid" },
    });
  });

  it("responds with 422 on invalid checksum", async () => {
    const payload = { ...validMetadata, checksum: "293948" };
    await expect(axios.post(metadataUrl, payload, { headers })).rejects.toMatchObject({
      response: { status: 422, data: "Request is missing checksum or checksum is invalid" },
    });
  });

  it("responds with 422 on missing instrument", async () => {
    const payload = { ...validMetadata, instrument: undefined };
    await expect(axios.post(metadataUrl, payload, { headers })).rejects.toMatchObject({
      response: { status: 422, data: "Request is missing instrument" },
    });
  });

  it("responds with 422 on invalid instrument", async () => {
    const payload = { ...validMetadata, instrument: "kukko" };
    await expect(axios.post(metadataUrl, payload, { headers })).rejects.toMatchObject({
      response: { status: 422, data: "Instrument doesn't match instrument PID" },
    });
  });

  it("responds with 422 on model metadata", async () => {
    await expect(axios.post(metadataUrl, validModelMetadata, { headers })).rejects.toMatchObject({
      response: { status: 422, data: "Request is missing instrument" },
    });
  });

  it("responds with 401 on missing authentication", async () => {
    const payload = { ...validMetadata, site: undefined };
    await expect(axios.post(metadataUrl, payload)).rejects.toMatchObject({
      response: { status: 401, data: "Unauthorized" },
    });
  });

  it("responds with 401 on non-existent username", async () => {
    const badHeaders = { authorization: `Basic ${str2base64("espoo:lol")}` };
    await expect(axios.post(metadataUrl, validMetadata, { headers: badHeaders })).rejects.toMatchObject({
      response: { status: 401, data: "Unauthorized" },
    });
  });
});

describe("PUT /upload/data/:checksum", () => {
  const validUrl = `${dataUrl}${validMetadata.checksum}`;
  const validFile = "content";

  beforeEach(async () => {
    await instrumentRepo.createQueryBuilder().delete().execute();
    await expect(axios.post(metadataUrl, validMetadata, { headers })).resolves.toMatchObject({ status: 200 });
  });

  it("responds with 201 on submitting new file", async () => {
    await expect(axios.put(validUrl, validFile, { headers })).resolves.toMatchObject({ status: 201 });
    const md = await instrumentRepo.findOneByOrFail({ checksum: validMetadata.checksum });
    expect(new Date(md.updatedAt).getTime()).toBeGreaterThan(new Date(md.createdAt).getTime());
    expect(md.status).toEqual(Status.UPLOADED);
  });

  it("responds with 201 on submitting new doppler-lidar file", async () => {
    const haloMetadata = {
      ...validMetadata,
      instrumentPid: "https://hdl.handle.net/123/warsaw-halo",
      instrument: "halo-doppler-lidar",
    };
    await expect(axios.post(metadataUrl, haloMetadata, { headers })).resolves.toMatchObject({ status: 200 });
    let md = await instrumentRepo.findOneByOrFail({ checksum: validMetadata.checksum });
    expect(md.status).toEqual(Status.CREATED);
    await expect(axios.put(validUrl, validFile, { headers })).resolves.toMatchObject({ status: 201 });
    md = await instrumentRepo.findOneByOrFail({ checksum: validMetadata.checksum });
    expect(md.status).toEqual(Status.UPLOADED);
  });

  it("responds with 200 on submitting existing file", async () => {
    await axios.put(validUrl, validFile, { headers });
    const md1 = await instrumentRepo.findOneByOrFail({ checksum: validMetadata.checksum });
    await expect(axios.put(validUrl, validFile, { headers })).resolves.toMatchObject({ status: 200 });
    const md2 = await instrumentRepo.findOneByOrFail({ checksum: validMetadata.checksum });
    expect(new Date(md1.updatedAt).getTime()).toEqual(new Date(md2.updatedAt).getTime());
  });

  it("saves correct file size", async () => {
    await axios.put(validUrl, validFile, { headers });
    const md = await instrumentRepo.findOneByOrFail({ checksum: validMetadata.checksum });
    expect(md.size).toBe(validFile.length + "");
  });

  it("responds with 400 on invalid hash", async () => {
    const url = `${dataUrl}file1.lv1`;
    await expect(axios.put(url, validFile, { headers })).rejects.toMatchObject({ response: { status: 400 } });
  });

  it("responds with 400 on incorrect hash", async () => {
    const invalidFile = "invalidhash";
    await expect(axios.put(validUrl, invalidFile, { headers })).rejects.toMatchObject({
      response: { status: 400 },
    });
  });

  it("responds with 400 on nonexistent hash", async () => {
    const url = `${dataUrl}9a0364b9e99bb480dd25e1f0284c8554`;
    await expect(axios.put(url, validFile, { headers })).rejects.toMatchObject({ response: { status: 400 } });
  });

  it("responds with 500 on internal errors", async () => {
    const invalidFile = "servererr";
    await expect(axios.put(validUrl, invalidFile, { headers })).rejects.toMatchObject({
      response: { status: 500 },
    });
  });

  it("responds with 401 when submitting data with wrong credentials", async () => {
    const now = new Date();
    const headers = { authorization: `Basic ${str2base64("martinlaakso:lol")}` };
    await expect(axios.put(validUrl, validFile, { headers })).rejects.toMatchObject({ response: { status: 401 } });
    const md = await instrumentRepo.findOneByOrFail({ checksum: validMetadata.checksum });
    expect(new Date(md.updatedAt).getTime()).toBeLessThan(now.getTime());
  });

  it("responds with 400 on submitting model file", async () => {
    const invalidUrl = `${modelDataUrl}${validMetadata.checksum}`;
    await expect(axios.put(invalidUrl, validFile, { headers })).rejects.toMatchObject({
      response: { status: 400, data: { status: 400, errors: "No metadata matches this hash" } },
    });
    const md = await instrumentRepo.findOneByOrFail({ checksum: validMetadata.checksum });
    expect(md.status).toEqual(Status.CREATED);
  });
});

describe("PUT /model-upload/data/:checksum", () => {
  const headers = { authorization: `Basic ${str2base64("bob:bobs_pass")}` };

  beforeEach(async () => {
    await modelRepo.createQueryBuilder().delete().execute();
    await axios.post(modelMetadataUrl, validModelMetadata, { headers });
  });

  it("responds with 201 on submitting new model file", async () => {
    const validModelUrl = `${modelDataUrl}${validModelMetadata.checksum}`;
    const validFile = "content";
    await expect(axios.put(validModelUrl, validFile, { headers })).resolves.toMatchObject({ status: 201 });
    const md = await modelRepo.findOneByOrFail({ checksum: validModelMetadata.checksum });
    expect(md.status).toEqual(Status.UPLOADED);
  });

  it("responds with 400 on submitting instrument file", async () => {
    const invalidUrl = `${dataUrl}${validModelMetadata.checksum}`;
    const validFile = "content";
    await expect(axios.put(invalidUrl, validFile, { headers })).rejects.toMatchObject({
      response: { status: 400, data: "No metadata matches this hash" },
    });
    const md = await modelRepo.findOneByOrFail({ checksum: validModelMetadata.checksum });
    expect(md.status).toEqual(Status.CREATED);
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
    await modelRepo.createQueryBuilder().delete().execute();
  });

  it("inserts metadata if volatile model file exists", async () => {
    const payload = { ...metaData, measurementDate: "2020-05-12" };
    await expect(axios.post(modelMetadataUrl, payload, { headers })).resolves.toMatchObject({ status: 200 });
    await modelRepo.findOneByOrFail({ checksum: metaData.checksum });
  });

  it("inserts new metadata and takes site from metadata", async () => {
    await expect(axios.post(modelMetadataUrl, validModelMetadata, { headers })).resolves.toMatchObject({ status: 200 });
    const md = await modelRepo.findOneOrFail({
      where: { checksum: validModelMetadata.checksum },
      relations: { site: true, model: true },
    });
    expect(md.site.id).toBe(validModelMetadata.site);
  });

  it("updates metadata submitted with allowUpdate flag", async () => {
    const payload = { ...validMetadata, instrument: undefined, allowUpdate: true, model: "ecmwf" };
    await expect(axios.post(modelMetadataUrl, payload, { headers })).resolves.toMatchObject({ status: 200 });
    const md = await modelRepo.findOneByOrFail({ checksum: payload.checksum });
    await modelRepo.update(md.uuid, { updatedAt: "2020-11-07" });
    const payloadResub = { ...payload, checksum: "ac5c1f6c923cc8b259c2e22c7b258ee4" };
    await expect(axios.post(modelMetadataUrl, payloadResub, { headers })).resolves.toMatchObject({ status: 200 });
    const mdResub = await modelRepo.findOneByOrFail({ uuid: md.uuid });
    expect(mdResub.checksum).toBe(payloadResub.checksum);
  });

  it("responds with 409 on existing hashsum with allowUpdate=True", async () => {
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
    await modelRepo.save(uploadedMetadata as any);
    await expect(axios.post(modelMetadataUrl, newUpload, { headers })).rejects.toMatchObject({
      response: { status: 409 },
    });
    const md = await modelRepo.findOneByOrFail({ checksum: uploadedMetadata.checksum });
    expect(new Date(md.updatedAt).getTime()).toEqual(now.getTime());
  });

  it("responds with 422 on instrument metadata", async () => {
    await expect(axios.post(modelMetadataUrl, validMetadata, { headers })).rejects.toMatchObject({
      response: { status: 422, data: { status: 422, errors: "Request is missing model" } },
    });
  });

  it("responds with 422 on missing model", async () => {
    const payload = { ...validModelMetadata, model: undefined };
    await expect(axios.post(modelMetadataUrl, payload, { headers })).rejects.toMatchObject({
      response: { status: 422, data: { status: 422, errors: "Request is missing model" } },
    });
  });

  it("responds with 422 on invalid model", async () => {
    const payload = { ...validModelMetadata, model: "kukko" };
    await expect(axios.post(modelMetadataUrl, payload, { headers })).rejects.toMatchObject({
      response: { status: 422, data: { status: 422, errors: "Unknown model" } },
    });
  });

  it("responds with 422 on empty model", async () => {
    const payload = { ...validModelMetadata, model: "" };
    await expect(axios.post(modelMetadataUrl, payload, { headers })).rejects.toMatchObject({
      response: { status: 422, data: { status: 422, errors: "Request is missing model" } },
    });
  });

  it("responds with 422 on missing site", async () => {
    const payload = { ...validModelMetadata, site: undefined }; // site defaults to username
    await expect(axios.post(modelMetadataUrl, payload, { headers })).rejects.toMatchObject({
      response: { status: 422, data: { status: 422, errors: "Unknown site" } },
    });
  });

  it("responds with 422 on empty site", async () => {
    const payload = { ...validModelMetadata, site: "" }; // site defaults to username
    await expect(axios.post(modelMetadataUrl, payload, { headers })).rejects.toMatchObject({
      response: { status: 422, data: { status: 422, errors: "Unknown site" } },
    });
  });

  it("responds with 422 on invalid site", async () => {
    const payload = { ...validModelMetadata, site: "aksjdfksdf" };
    await expect(axios.post(modelMetadataUrl, payload, { headers })).rejects.toMatchObject({
      response: { status: 422, data: { status: 422, errors: "Unknown site" } },
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

  it("updates status", async () => {
    await expect(axios.post(privateMetadataUrl, { uuid, status: Status.PROCESSED })).resolves.toMatchObject({
      status: 200,
    });
    await expect(instrumentRepo.findOneByOrFail({ uuid })).resolves.toMatchObject({ status: Status.PROCESSED });
  });

  it("updates status to invalid", async () => {
    await expect(axios.post(privateMetadataUrl, { uuid, status: "invalid" })).resolves.toMatchObject({ status: 200 });
    await expect(instrumentRepo.findOneByOrFail({ uuid })).resolves.toMatchObject({ status: "invalid" });
  });
});

describe("test content upload", () => {
  const headers = { authorization: `Basic ${str2base64("alice:alices_password")}` };
  const validMetadata = {
    filename: "file1.LV1",
    measurementDate: "2020-08-11",
    checksum: "9a0364b9e99bb480dd25e1f0284c8555",
    instrument: "mira",
    instrumentPid: "https://hdl.handle.net/123/granada-mira",
    site: "granada",
  };
  const content = "content";

  beforeAll(async () => {
    await initUsersAndPermissions();
  });

  afterAll(async () => {
    await Promise.all([instrumentRepo.createQueryBuilder().delete().execute()]);
  });

  beforeEach(async () => {
    await instrumentRepo.createQueryBuilder().delete().execute();
  });

  it("tests content upload", async () => {
    await expect(axios.post(metadataUrl, validMetadata, { headers })).resolves.toMatchObject({ status: 200 });
    const checksum = validMetadata.checksum;
    const postDataUrl = dataUrl.concat(checksum);
    await expect(axios.put(postDataUrl, content, { headers })).resolves.toMatchObject({ status: 201 });
    const metadata = await instrumentRepo.findOneByOrFail({ checksum });
    expect(new Date(metadata.updatedAt).getTime()).toBeGreaterThan(new Date(metadata.createdAt).getTime());
  });
});

describe("Test instrument upload with tags", () => {
  beforeAll(async () => {
    await instrumentRepo.createQueryBuilder().delete().execute();
  });
  const headers = { authorization: `Basic ${str2base64("alice:alices_password")}` };
  const payload_co = {
    site: "hyytiala",
    filename: "Stare_34_20220101_19.hpl",
    instrument: "halo-doppler-lidar",
    instrumentPid: "https://hdl.handle.net/123/warsaw-halo",
    measurementDate: "2022-01-01",
    checksum: "947eb3a21cdbafc0d2c9027adf8ac42e",
    tags: ["co"],
  };
  const payload_cross = {
    site: "hyytiala",
    filename: "Stare_34_20220101_19.hpl",
    instrument: "halo-doppler-lidar",
    instrumentPid: "https://hdl.handle.net/123/warsaw-halo",
    measurementDate: "2022-01-01",
    checksum: "b5a221450f2029ed4d20196851a01a0a",
    tags: ["cross"],
  };
  const url_co = `${dataUrl}${payload_co.checksum}`;
  const url_cross = `${dataUrl}${payload_cross.checksum}`;

  it("tests co metadata upload with co tags", async () => {
    await expect(axios.post(metadataUrl, payload_co, { headers })).resolves.toMatchObject({ status: 200 });
  });

  it("tests cross metadata upload of with same filename and cross tags", async () => {
    await expect(axios.post(metadataUrl, payload_cross, { headers })).resolves.toMatchObject({ status: 200 });
  });

  it("tests data upload for the co file", async () => {
    const content = "co-content";
    await expect(axios.put(url_co, content, { headers })).resolves.toMatchObject({ status: 201 });
  });

  it("tests data upload for the cross file", async () => {
    const content = "cross-content";
    await expect(axios.put(url_cross, content, { headers })).resolves.toMatchObject({ status: 201 });
  });

  it("tests that co file exists", async () => {
    const record = await instrumentRepo.findOneByOrFail({
      filename: payload_co.filename,
      tags: ArrayEqual(payload_co.tags),
      checksum: payload_co.checksum,
    });
    expect(record).toMatchObject({ status: "uploaded" });
  });

  it("tests that cross file exists", async () => {
    const record = await instrumentRepo.findOneByOrFail({
      filename: payload_cross.filename,
      tags: ArrayEqual(payload_cross.tags),
      checksum: payload_cross.checksum,
    });
    expect(record).toMatchObject({ status: "uploaded" });
  });
});

describe("tags: Test instrument upload metadata tag update", () => {
  beforeAll(async () => {
    await instrumentRepo.createQueryBuilder().delete().execute();
  });
  const headers = { authorization: `Basic ${str2base64("alice:alices_password")}` };
  const payload_co = {
    site: "hyytiala",
    filename: "Stare_34_20220101_19.hpl",
    instrument: "halo-doppler-lidar",
    instrumentPid: "https://hdl.handle.net/123/warsaw-halo",
    measurementDate: "2022-01-01",
    checksum: "947eb3a21cdbafc0d2c9027adf8ac42e",
    tags: ["co"],
  };
  const payload_cross = {
    site: "hyytiala",
    filename: "Stare_34_20220101_19.hpl",
    instrument: "halo-doppler-lidar",
    instrumentPid: "https://hdl.handle.net/123/warsaw-halo",
    measurementDate: "2022-01-01",
    checksum: "b5a221450f2029ed4d20196851a01a0a",
    tags: ["cross"],
  };

  it("tests co metadata upload with co tags", async () => {
    await expect(axios.post(metadataUrl, payload_co, { headers })).resolves.toMatchObject({ status: 200 });
  });

  it("tests cross metadata upload with cross tags", async () => {
    await expect(axios.post(metadataUrl, payload_cross, { headers })).resolves.toMatchObject({ status: 200 });
  });

  it("tests cross metadata tags changes to co", async () => {
    await expect(axios.post(metadataUrl, { ...payload_cross, tags: ["co"] }, { headers })).resolves.toMatchObject({
      status: 200,
    });
  });

  it("tests that original cross metadata has now co tags", async () => {
    const record = await instrumentRepo.findOneOrFail({
      where: { filename: payload_cross.filename, checksum: payload_cross.checksum },
    });
    expect(record).toMatchObject({ status: "created", tags: ["co"] });
  });

  it("tests that original co metadata has been removed", async () => {
    await expect(
      instrumentRepo.existsBy({ filename: payload_co.filename, checksum: payload_co.checksum }),
    ).resolves.toBe(false);
  });
});

describe("Test instrument upload with various tags", () => {
  beforeAll(async () => {
    await instrumentRepo.createQueryBuilder().delete().execute();
  });
  const headers = { authorization: `Basic ${str2base64("alice:alices_password")}` };
  const payload_co = {
    site: "hyytiala",
    filename: "Stare_34_20220101_19.hpl",
    instrument: "halo-doppler-lidar",
    instrumentPid: "https://hdl.handle.net/123/warsaw-halo",
    measurementDate: "2022-01-01",
    checksum: "947eb3a21cdbafc0d2c9027adf8ac42e",
    tags: ["co"],
  };

  it("tests that using prohibited tags fails", async () => {
    await expect(axios.post(metadataUrl, { ...payload_co, tags: ["XYZ", "co"] }, { headers })).rejects.toMatchObject({
      response: { status: 422 },
    });
  });

  it("tests that tag not given as a list fails", async () => {
    await expect(axios.post(metadataUrl, { ...payload_co, tags: "co" }, { headers })).rejects.toMatchObject({
      response: { status: 422 },
    });
  });

  it("tests that tags work as sorted(list(set(submitted_tags)))", async () => {
    await expect(
      axios.post(metadataUrl, { ...payload_co, tags: ["cross", "co", "co"] }, { headers }),
    ).resolves.toMatchObject({
      status: 200,
    });
    const record = await instrumentRepo.findOneOrFail({
      where: { filename: payload_co.filename, checksum: payload_co.checksum },
    });
    expect(record).toMatchObject({ tags: ["co", "cross"] });
  });
});

describe("test user permissions", () => {
  beforeAll(async () => {
    await initUsersAndPermissions();
  });

  afterAll(async () => {
    await instrumentRepo.createQueryBuilder().delete().execute();
  });

  beforeEach(async () => {
    await instrumentRepo.createQueryBuilder().delete().execute();
    await modelRepo.createQueryBuilder().delete().execute();
  });

  it("tests that alice can upload to all sites", async () => {
    const sites: any[] = (await axios.get(backendPublicUrl.concat("sites"))).data;
    for (const site of sites) {
      await expectSuccessfulUploadInstrument("alice", "alices_password", site.id);
      await expectFailedUploadModel("alice", "alices_password", site.id, "ecmwf");
    }
  });

  it("tests that bob can upload all models to all sites", async () => {
    const sites: any[] = (await axios.get(backendPublicUrl.concat("sites"))).data;
    for (const site of sites) {
      await expectSuccessfulUploadModel("bob", "bobs_pass", site.id, "ecmwf");
      await expectSuccessfulUploadModel("bob", "bobs_pass", site.id, "icon-iglo-12-23");
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

  it("tests that david can upload only ecmwf model to granada and instrument to mace-head", async () => {
    const sites: any[] = (await axios.get(backendPublicUrl.concat("sites"))).data;
    for (const site of sites) {
      if (site.id === "granada") {
        await expectSuccessfulUploadModel("david", "davids^passphrase", site.id, "ecmwf");
        await expectFailedUploadModel("david", "davids^passphrase", site.id, "icon-iglo-12-23");
        await expectFailedUploadInstrument("david", "davids^passphrase", site.id);
      } else if (site.id === "mace-head") {
        await expectSuccessfulUploadInstrument("david", "davids^passphrase", site.id);
        await expectFailedUploadModel("david", "davids^passphrase", site.id, "ecmwf");
        await expectFailedUploadModel("david", "davids^passphrase", site.id, "icon-iglo-12-23");
      } else {
        await expectFailedUploadInstrument("david", "davids^passphrase", site.id);
        await expectFailedUploadModel("david", "davids^passphrase", site.id, "ecmwf");
        await expectFailedUploadModel("david", "davids^passphrase", site.id, "icon-iglo-12-23");
      }
    }
  });

  it("tests that bucharest can upload only to bucharest", async () => {
    const sites: any[] = (await axios.get(backendPublicUrl.concat("sites"))).data;
    for (const site of sites) {
      if (site.id === "bucharest") {
        await expectSuccessfulUploadInstrument("bucharest", "passWordForBucharest", site.id);
        await expectFailedUploadModel("bucharest", "passWordForBucharest", site.id, "ecmwf");
      } else {
        await expectFailedUploadInstrument("bucharest", "passWordForBucharest", site.id);
        await expectFailedUploadModel("bucharest", "passWordForBucharest", site.id, "ecmwf");
      }
    }
  });

  it("tests that granada can upload only to granada", async () => {
    const sites: any[] = (await axios.get(backendPublicUrl.concat("sites"))).data;
    for (const site of sites) {
      if (site.id === "granada") {
        await expectSuccessfulUploadInstrument("granada", "PASSWORDFORgranada", site.id);
        await expectFailedUploadModel("granada", "PASSWORDFORgranada", site.id, "ecmwf");
      } else {
        await expectFailedUploadInstrument("granada", "PASSWORDFORgranada", site.id);
        await expectFailedUploadModel("granada", "PASSWORDFORgranada", site.id, "ecmwf");
      }
    }
  });

  it("tests that mace-head can upload only to mace-head", async () => {
    const sites: any[] = (await axios.get(backendPublicUrl.concat("sites"))).data;
    for (const site of sites) {
      if (site.id === "mace-head") {
        await expectSuccessfulUploadInstrument("mace-head", "SfSCHhnU5cjrMiLdgcW3ixkTQRo", site.id);
        await expectFailedUploadModel("mace-head", "SfSCHhnU5cjrMiLdgcW3ixkTQRo", site.id, "ecmwf");
      } else {
        await expectFailedUploadInstrument("mace-head", "SfSCHhnU5cjrMiLdgcW3ixkTQRo", site.id);
        await expectFailedUploadModel("mace-head", "SfSCHhnU5cjrMiLdgcW3ixkTQRo", site.id, "ecmwf");
      }
    }
  });

  it("tests that eve cannot upload anywhere", async () => {
    const sites: any[] = (await axios.get(backendPublicUrl.concat("sites"))).data;
    for (const site of sites) {
      await expectFailedUploadInstrument("eve", "eves_passphraase", site.id);
      await expectFailedUploadModel("eve", "eves_passphraase", site.id, "ecmwf");
    }
  });

  it("tests that users cannot upload with wrong passwords", async () => {
    const user_accounts_url = `${backendPrivateUrl}user-accounts`;
    const sites: any[] = (await axios.get(backendPublicUrl.concat("sites"))).data;
    const users: any[] = (await axios.get(user_accounts_url)).data;
    for (const site of sites) {
      for (const user of users) {
        const length = randomInt(1, 512);
        const randomPassword = randomBytes(length).toString("hex");
        await expectFailedUploadInstrument(user.username, randomPassword, site.id, false);
        await expectFailedUploadModel(user.username, randomPassword, site.id, "ecmwf", false);
        await expectFailedUploadInstrument(user.username, "", site.id, false);
        await expectFailedUploadModel(user.username, "", site.id, "ecmwf", false);
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
          await expectFailedUploadModel(usernameA, passwordB, site.id, "ecmwf", false);
        }
      }
    }
  }, 40000);

  it("tests that nonexistent users cannot upload with correct or incorrect passwords", async () => {
    const sites: any[] = (await axios.get(backendPublicUrl.concat("sites"))).data;
    const usernameLength = randomInt(1, 512);
    const randomUsername = randomBytes(usernameLength).toString("hex");
    for (const site of sites) {
      for (const password of Object.values(userCredentials)) {
        // Random username, some correct password
        await expectFailedUploadInstrument(randomUsername, password, site.id, false);
        await expectFailedUploadModel(randomUsername, password, site.id, "ecmwf", false);
        // Random username, some random password
        const passwordLength = randomInt(1, 512);
        const randomPassword = randomBytes(passwordLength).toString("hex");
        await expectFailedUploadInstrument(randomUsername, randomPassword, site.id, false);
        await expectFailedUploadModel(randomUsername, randomPassword, site.id, "ecmwf", false);
        // Empty password
        await expectFailedUploadInstrument(randomUsername, "", site.id, false);
        await expectFailedUploadModel(randomUsername, "", site.id, "ecmwf", false);
        // empty username
        await expectFailedUploadInstrument("", password, site.id, false);
        await expectFailedUploadModel("", password, site.id, "ecmwf", false);
        await expectFailedUploadInstrument("", "", site.id, false);
        await expectFailedUploadModel("", "", site.id, "ecmwf", false);
      }
    }
  });
});

async function expectSuccessfulUploadInstrument(username: string, password: string, siteId: string) {
  const contentLength = randomInt(4, 128);
  const content = randomBytes(contentLength).toString("hex");
  const checksum = md5(content);
  const postMetadata = {
    filename: "file1.LV1",
    measurementDate: "2020-08-11",
    instrument: "mira",
    instrumentPid: "https://hdl.handle.net/123/bucharest-mira",
    checksum: checksum,
    site: siteId,
  };
  const credentials = username.concat(":", password);
  const headers = { authorization: `Basic ${str2base64(credentials)}` };
  const timeBeforePost = new Date();
  // POST metadata
  await expect(axios.post(metadataUrl, postMetadata, { headers })).resolves.toMatchObject({ status: 200 });
  const metadataFromDb = await instrumentRepo.findOneByOrFail({ checksum });
  expect(metadataFromDb).toBeTruthy();
  expect(new Date(metadataFromDb.createdAt).getTime()).toBeGreaterThan(timeBeforePost.getTime());
  expect(new Date(metadataFromDb.updatedAt).getTime()).toEqual(new Date(metadataFromDb.createdAt).getTime());
  expect(metadataFromDb.status).toEqual(Status.CREATED);
  // PUT data
  const putDataUrl = dataUrl.concat(checksum);
  await expect(axios.put(putDataUrl, content, { headers })).resolves.toMatchObject({ status: 201 });
  const metadataFromDbAfterPut = await instrumentRepo.findOneByOrFail({ checksum });
  expect(new Date(metadataFromDbAfterPut.updatedAt).getTime()).toBeGreaterThan(
    new Date(metadataFromDbAfterPut.createdAt).getTime(),
  );
}

async function expectFailedUploadInstrument(
  username: string,
  password: string,
  siteId: string,
  correctPassword = true,
) {
  const putStatus: number = correctPassword ? 400 : 401;
  const contentLength = randomInt(4, 128);
  const content = randomBytes(contentLength).toString("hex");
  const checksum = md5(content);
  const postMetadata = {
    filename: "file1.LV1",
    measurementDate: "2020-08-11",
    instrument: "mira",
    instrumentPid: "https://hdl.handle.net/123/bucharest-mira",
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
  await expect(instrumentRepo.existsBy({ checksum })).resolves.toBe(false);
}

async function expectSuccessfulUploadModel(username: string, password: string, siteId: string, modelId: string) {
  const contentLength = randomInt(4, 128);
  const content = randomBytes(contentLength).toString("hex");
  const checksum = md5(content);
  const postMetadata = {
    filename: `20200122_${siteId}_${modelId}.nc`,
    measurementDate: "2020-08-11",
    model: modelId,
    checksum: checksum,
    site: siteId,
  };
  const credentials = username.concat(":", password);
  const headers = { authorization: `Basic ${str2base64(credentials)}` };

  // POST metadata
  const timeBeforePost = new Date().getTime();
  await expect(axios.post(modelMetadataUrl, postMetadata, { headers })).resolves.toMatchObject({ status: 200 });
  const metadata = await modelRepo.findOneOrFail({
    where: { checksum: postMetadata.checksum },
    relations: { site: true, model: true },
  });
  const timeCreated = new Date(metadata.createdAt).getTime();
  expect(metadata.site.id).toEqual(siteId);
  expect(timeCreated).toBeGreaterThan(timeBeforePost);
  // PUT data
  const timeBeforePut = new Date().getTime();
  const putDataUrl = modelDataUrl.concat(checksum);
  await expect(axios.put(putDataUrl, content, { headers })).resolves.toMatchObject({ status: 201 });
  const metadataAfterPut = await modelRepo.findOneOrFail({
    where: { checksum: postMetadata.checksum },
    relations: { site: true, model: true },
  });
  const timeUpdated = new Date(metadataAfterPut.updatedAt).getTime();
  expect(timeUpdated).toBeGreaterThan(timeBeforePut);
}

async function expectFailedUploadModel(
  username: string,
  password: string,
  siteId: string,
  modelId: string,
  correctPassword = true,
) {
  const putStatus: number = correctPassword ? 400 : 401;
  const contentLength = randomInt(4, 128);
  const content = randomBytes(contentLength).toString("hex");
  const checksum = md5(content);
  const postMetadata = {
    filename: `20200122_${siteId}_${modelId}.nc`,
    measurementDate: "2020-08-11",
    model: modelId,
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
  await expect(modelRepo.existsBy({ checksum })).resolves.toBe(false);
}

function randomInt(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function md5(str: string) {
  return createHash("md5").update(str).digest("hex");
}

function randomMd5(): string {
  return randomBytes(16).toString("hex");
}
