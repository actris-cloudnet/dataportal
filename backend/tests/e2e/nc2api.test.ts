import * as fs from "fs";
import axios from "axios";
import { backendPrivateUrl, backendPublicUrl, storageServiceUrl, str2base64 } from "../lib";
import * as AdmZip from "adm-zip";
import { createHash } from "crypto";
import { DataSource, Repository } from "typeorm";
import { Download, ObjectType } from "../../src/entity/Download";
import { basename } from "path";
import { initUsersAndPermissions } from "../lib/userAccountAndPermissions";
import { AppDataSource } from "../../src/data-source";
import { RegularFile } from "../../src/entity/File";
import { Visualization } from "../../src/entity/Visualization";
import { InstrumentUpload } from "../../src/entity/Upload";
import { beforeAll, afterAll, describe, it, expect } from "@jest/globals";

let dataSource: DataSource;
let downloadRepo: Repository<Download>;
axios.defaults.headers.common["X-Forwarded-For"] = "2.125.160.216, 2.125.160.216, 10.134.8.1";

beforeAll(async () => {
  dataSource = await AppDataSource.initialize();
  downloadRepo = dataSource.getRepository(Download);
  await downloadRepo.delete({});
  await dataSource.getRepository(Visualization).delete({});
  await dataSource.getRepository(RegularFile).delete({});
});

afterAll(async () => {
  await downloadRepo.delete({});
  await dataSource.getRepository(Visualization).delete({});
  await dataSource.getRepository(RegularFile).delete({});
  await dataSource.destroy();
});

const inputJson = {
  uuid: "15506ea8-d357-4c7b-af8c-95dfcc34fc7d",
  measurementDate: "2019-07-23",
  s3key: "15506ea8-d357-4c7b-af8c-95dfcc34fc7d/20190723_bucharest_classification.nc",
  filename: "20190723_bucharest_classification.nc",
  checksum: "b77b731aaae54f403aae6765ad1d20e1603b4454e2bc0d461aab4985a4a82ca4",
  size: 139021,
  format: "HDF5 (NetCDF4)",
  product: "classification",
  site: "bucharest",
  volatile: true,
  version: "1234",
};

const inputJson2 = {
  uuid: "25506ea8-d357-4c7b-af8c-95dfcc34fc7d",
  measurementDate: "2019-07-24",
  s3key: "25506ea8-d357-4c7b-af8c-95dfcc34fc7d/20190724_bucharest_classification.nc",
  filename: "20190724_bucharest_classification.nc",
  checksum: "6904509c9e03154d9c831aaa8595e01eb5339110e842a34e16f24ffb4456e061",
  size: 139021,
  format: "HDF5 (NetCDF4)",
  product: "classification",
  site: "bucharest",
  volatile: true,
  version: "1234",
};

const expectedJson = {
  uuid: "15506ea8-d357-4c7b-af8c-95dfcc34fc7d",
  measurementDate: "2019-07-23",
  filename: "20190723_bucharest_classification.nc",
  s3key: "15506ea8-d357-4c7b-af8c-95dfcc34fc7d/20190723_bucharest_classification.nc",
  checksum: "b77b731aaae54f403aae6765ad1d20e1603b4454e2bc0d461aab4985a4a82ca4",
  size: "139021",
  format: "HDF5 (NetCDF4)",
  product: {
    humanReadableName: "Classification",
    id: "classification",
    level: "2",
  },
  site: {
    id: "bucharest",
    humanReadableName: "Bucharest",
    latitude: 44.348,
    longitude: 26.029,
    altitude: 93,
    gaw: null,
    country: "Romania",
  },
  volatile: true,
  version: "1234",
};

const filepath = "tests/data/20190723_bucharest_classification.nc";
const s3key = inputJson.s3key;

describe("after PUTting metadata to API", () => {
  beforeAll(async () => {
    await axios.put(`${storageServiceUrl}cloudnet-product-volatile/${s3key}`, fs.createReadStream(filepath));
    return axios.put(`${backendPrivateUrl}files/${s3key}`, inputJson);
  });

  it("responds with a corresponding metadata JSON", async () => {
    return axios
      .get(`${backendPublicUrl}files/${inputJson.uuid}`)
      .then((response) => expect(response.data).toMatchObject(expectedJson));
  });

  it("serves the file and increases download count", async () => {
    return axios
      .get(`${backendPublicUrl}download/product/${expectedJson.uuid}/${expectedJson.filename}`, {
        responseType: "arraybuffer",
      })
      .then((response) => {
        expect(response.status).toEqual(200);
        const hash = createHash("sha256");
        hash.update(response.data);
        expect(hash.digest("hex")).toEqual(expectedJson.checksum);
        return expect(
          downloadRepo.existsBy({
            objectUuid: expectedJson.uuid,
            objectType: ObjectType.Product,
            ip: "2.125.160.216",
            country: "GB",
          }),
        ).resolves.toBe(true);
      });
  });

  it("responds with 400 if file not uploaded", async () => {
    return expect(axios.put(`${backendPrivateUrl}files/notfound`, inputJson)).rejects.toMatchObject({
      response: { status: 400 },
    });
  });

  describe("after PUTting more metadata to API", () => {
    let collectionUuid = "";
    beforeAll(async () => {
      const filepath = "tests/data/20190724_bucharest_classification.nc";
      const s3key = inputJson2.s3key;
      await axios.put(`${storageServiceUrl}cloudnet-product-volatile/${s3key}`, fs.createReadStream(filepath));
      await axios.put(`${backendPrivateUrl}files/${s3key}`, inputJson2);
      const res = await axios.post(`${backendPublicUrl}collection/`, { files: [expectedJson.uuid, inputJson2.uuid] });
      collectionUuid = res.data;
    });

    it("hashes of /download zipped files match originals and collection download count increases", async () => {
      const expectedShas = await (
        await axios.get(`${backendPublicUrl}files/`, { params: { site: "bucharest" } })
      ).data.map((file: any) => file.checksum);
      const receivedFile = await axios.get(`${backendPublicUrl}download/collection/${collectionUuid}`, {
        responseType: "arraybuffer",
      });
      const entries = new AdmZip(receivedFile.data).getEntries();

      const readmeEntry = entries.find((entry) => entry.entryName === "README.md");
      expect(readmeEntry).toBeDefined();
      const readmeContent = readmeEntry!.getData().toString("utf-8");
      expect(readmeContent).toContain(collectionUuid);
      expect(readmeContent).toContain(
        "Custom collection of classification data from Bucharest between 23 and 24 Jul 2019",
      );

      const licenseEntry = entries.find((entry) => entry.entryName === "LICENSE.txt");
      expect(licenseEntry).toBeDefined();

      const shas = entries
        .filter((entry) => entry.entryName.endsWith(".nc"))
        .map((entry) => {
          const hash = createHash("sha256");
          hash.update(entry.getData());
          return hash.digest("hex");
        });
      expect(shas.sort()).toMatchObject(expectedShas.sort());

      return expect(
        downloadRepo.existsBy({
          objectUuid: collectionUuid,
          objectType: ObjectType.Collection,
          ip: "2.125.160.216",
          country: "GB",
        }),
      ).resolves.toBe(true);
    });
  });
});

describe("after PUTting a raw instrument file", () => {
  const validMetadata = {
    filename: "file1.LV1",
    measurementDate: "2020-08-11",
    checksum: "9a0364b9e99bb480dd25e1f0284c8555",
    instrument: "mira",
    instrumentPid: "https://hdl.handle.net/123/granada-mira",
    site: "granada",
  };
  const rawFile = "content";
  const headers = { authorization: `Basic ${str2base64("granada:PASSWORDFORgranada")}` };
  const metadataUrl = `${backendPrivateUrl}upload/metadata/`;
  const dataUrl = `${backendPrivateUrl}upload/data/`;
  const uploadUrl = `${dataUrl}${validMetadata.checksum}`;

  beforeAll(async () => {
    await initUsersAndPermissions();
    await dataSource.getRepository(InstrumentUpload).delete({});
    await downloadRepo.delete({});
    await axios.post(metadataUrl, validMetadata, { headers });
    return axios.put(uploadUrl, rawFile, { headers });
  });

  it("serves the file and increases download count", async () => {
    const { data } = await axios.get(`${backendPrivateUrl}upload/metadata/${validMetadata.checksum}`, { headers });
    return axios.get(data.downloadUrl, { responseType: "arraybuffer" }).then((response) => {
      expect(response.status).toEqual(200);
      const hash = createHash("md5");
      hash.update(response.data);
      expect(hash.digest("hex")).toEqual(validMetadata.checksum);
      return expect(
        downloadRepo.existsBy({
          objectUuid: data.uuid,
          objectType: ObjectType.Raw,
          ip: "2.125.160.216",
          country: "GB",
        }),
      ).resolves.toBe(true);
    });
  });
});
