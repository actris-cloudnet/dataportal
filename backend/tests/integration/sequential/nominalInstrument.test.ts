import axios from "axios";
import { DataSource } from "typeorm";
import { backendPublicUrl, genResponse, cleanRepos, loadFixture } from "../../lib";
import { UserAccount } from "../../../src/entity/UserAccount";
import { Permission, PermissionType } from "../../../src/entity/Permission";
import { Site } from "../../../src/entity/Site";
import { NominalInstrument } from "../../../src/entity/Instrument";
import { AppDataSource } from "../../../src/data-source";
import { describe, expect, it, beforeAll, afterAll } from "@jest/globals";

let dataSource: DataSource;

const bucharestUrl = `${backendPublicUrl}sites/bucharest/nominal-instruments`;
const hyytialaUrl = `${backendPublicUrl}sites/hyytiala/nominal-instruments`;
const lookupUrl = `${backendPublicUrl}nominal-instrument`;
const pidsUrl = `${backendPublicUrl}instrument-pids`;

const bucharestChm15k = "c43e9f54-c94d-45f7-8596-223b1c2b14c0";
const warsawHalo = "eb4b39e5-6bc8-40f0-92d2-43d31f224de6";
const bucharestMira = "0b3a7fa0-4812-4964-af23-1162e8b3a665";
const ubbChm15k = "d6bf209b-c48b-48a4-bbfb-fed713b27832";
const ubbHatpro = "028adedd-35a4-4733-ad7b-78fdf9555a02";
const hyytialaRpg = "a43e9f54-c94d-45f7-8596-223b1c2b14c1";

const managerCreds = { username: "nominal-manager", password: "hunter2" };
const hyytialaCreds = { username: "nominal-hyytiala", password: "hunter2" };
const nopermCreds = { username: "nominal-noperm", password: "hunter2" };

async function createUser(creds: { username: string; password: string }, site: Site | null, withPerm = true) {
  const user = new UserAccount();
  user.username = creds.username;
  user.setPassword(creds.password);
  await dataSource.getRepository(UserAccount).save(user);
  if (withPerm) {
    const perm = new Permission();
    perm.permission = PermissionType.canManageNominalInstruments;
    perm.site = site;
    perm.model = null;
    perm.userAccounts = [user];
    await dataSource.getRepository(Permission).save(perm);
  }
}

beforeAll(async () => {
  dataSource = await AppDataSource.initialize();
  await cleanRepos(dataSource);
  await loadFixture(dataSource, "0-model_citation");
  await loadFixture(dataSource, "0-regular_citation");
  await loadFixture(dataSource, "1-product");
  await loadFixture(dataSource, "1-site");
  await loadFixture(dataSource, "2-instrument");
  await loadFixture(dataSource, "3-instrument_info");
  await loadFixture(dataSource, "4-instrument_upload");
  await loadFixture(dataSource, "4-nominal_instrument");
  const hyytiala = await dataSource.getRepository(Site).findOneByOrFail({ id: "hyytiala" });
  await createUser(managerCreds, null);
  await createUser(hyytialaCreds, hyytiala);
  await createUser(nopermCreds, null, false);
});

afterAll(async () => {
  await dataSource.destroy();
});

describe("GET /api/sites/:siteId/nominal-instruments", () => {
  it("lists history ordered by product and date", async () => {
    const res = await axios.get(bucharestUrl);
    expect(res.data).toHaveLength(2);
    expect(res.data[0]).toMatchObject({
      siteId: "bucharest",
      productId: "lidar",
      measurementDate: "2024-06-01",
      nominalInstrument: { uuid: warsawHalo, instrument: { id: "halo-doppler-lidar" } },
    });
    expect(res.data[1]).toMatchObject({ measurementDate: "2024-01-01", nominalInstrument: { uuid: bucharestChm15k } });
  });

  it("returns 404 for unknown site", async () => {
    await expect(axios.get(`${backendPublicUrl}sites/nonexistent/nominal-instruments`)).rejects.toMatchObject(
      genResponse(404, { status: 404, errors: "Site not found" }),
    );
  });
});

describe("POST /api/sites/:siteId/nominal-instruments", () => {
  const payload = { productId: "radar", instrumentInfoUuid: bucharestMira, measurementDate: "2024-01-01" };

  it("rejects without auth", async () => {
    await expect(axios.post(bucharestUrl, payload)).rejects.toMatchObject({ response: { status: 401 } });
  });

  it("rejects without permission", async () => {
    await expect(axios.post(bucharestUrl, payload, { auth: nopermCreds })).rejects.toMatchObject({
      response: { status: 401 },
    });
  });

  it("rejects site-scoped permission for another site", async () => {
    await expect(axios.post(bucharestUrl, payload, { auth: hyytialaCreds })).rejects.toMatchObject({
      response: { status: 401 },
    });
  });

  it("accepts site-scoped permission for own site", async () => {
    const res = await axios.post(
      hyytialaUrl,
      { productId: "radar", instrumentInfoUuid: hyytialaRpg, measurementDate: "2024-01-01" },
      { auth: hyytialaCreds },
    );
    expect(res.status).toBe(201);
    expect(res.data).toMatchObject({
      siteId: "hyytiala",
      productId: "radar",
      nominalInstrument: { uuid: hyytialaRpg },
    });
  });

  it("creates a nominal instrument visible in lookup", async () => {
    const res = await axios.post(bucharestUrl, payload, { auth: managerCreds });
    expect(res.status).toBe(201);
    expect(res.data).toMatchObject({
      siteId: "bucharest",
      productId: "radar",
      measurementDate: "2024-01-01",
      nominalInstrument: { uuid: bucharestMira, instrument: { id: "mira-35" } },
    });
    const lookup = await axios.get(lookupUrl, { params: { site: "bucharest", product: "radar", date: "2024-02-01" } });
    expect(lookup.data).toMatchObject({ nominalInstrument: { uuid: bucharestMira } });
  });

  it("rejects entry repeating the previous instrument", async () => {
    await expect(
      axios.post(bucharestUrl, { ...payload, measurementDate: "2024-05-01" }, { auth: managerCreds }),
    ).rejects.toMatchObject(
      genResponse(409, {
        status: 409,
        errors: "Bucharest MIRA is already the nominal radar instrument from 2024-01-01",
      }),
    );
  });

  it("rejects entry repeating the next instrument", async () => {
    await expect(
      axios.post(bucharestUrl, { ...payload, measurementDate: "2023-01-01" }, { auth: managerCreds }),
    ).rejects.toMatchObject(
      genResponse(409, {
        status: 409,
        errors:
          "Bucharest MIRA is already the nominal radar instrument from 2024-01-01; edit that entry's date instead",
      }),
    );
  });

  it("rejects duplicate date", async () => {
    await expect(axios.post(bucharestUrl, payload, { auth: managerCreds })).rejects.toMatchObject(
      genResponse(409, { status: 409, errors: "A nominal instrument for radar is already set from 2024-01-01" }),
    );
  });

  it("rejects invalid date", async () => {
    await expect(
      axios.post(bucharestUrl, { ...payload, measurementDate: "2024-1-1" }, { auth: managerCreds }),
    ).rejects.toMatchObject(genResponse(400, { status: 400, errors: "measurementDate must be YYYY-MM-DD" }));
    await expect(
      axios.post(bucharestUrl, { ...payload, measurementDate: "2024-02-30" }, { auth: managerCreds }),
    ).rejects.toMatchObject({ response: { status: 400 } });
  });

  it("rejects unknown product and non-instrument product", async () => {
    await expect(
      axios.post(bucharestUrl, { ...payload, productId: "nonexistent" }, { auth: managerCreds }),
    ).rejects.toMatchObject(genResponse(400, { status: 400, errors: "Product not found" }));
    await expect(
      axios.post(bucharestUrl, { ...payload, productId: "classification" }, { auth: managerCreds }),
    ).rejects.toMatchObject({ response: { status: 400 } });
  });

  it("rejects missing body", async () => {
    await expect(axios.post(bucharestUrl, undefined, { auth: managerCreds })).rejects.toMatchObject({
      response: { status: 400 },
    });
  });

  it("rejects instrument for product without compatible instruments", async () => {
    await expect(
      axios.post(bucharestUrl, { ...payload, productId: "disdrometer" }, { auth: managerCreds }),
    ).rejects.toMatchObject({ response: { status: 400, data: { errors: expect.stringContaining("cannot produce") } } });
  });

  it("rejects unknown and incompatible instrument", async () => {
    await expect(
      axios.post(
        bucharestUrl,
        { ...payload, instrumentInfoUuid: "00000000-0000-0000-0000-000000000000" },
        { auth: managerCreds },
      ),
    ).rejects.toMatchObject(genResponse(400, { status: 400, errors: "Instrument not found" }));
    await expect(
      axios.post(bucharestUrl, { ...payload, instrumentInfoUuid: bucharestChm15k }, { auth: managerCreds }),
    ).rejects.toMatchObject({ response: { status: 400, data: { errors: expect.stringContaining("cannot produce") } } });
  });

  it("returns 404 for unknown site", async () => {
    await expect(
      axios.post(`${backendPublicUrl}sites/nonexistent/nominal-instruments`, payload, { auth: managerCreds }),
    ).rejects.toMatchObject({ response: { status: 404 } });
  });
});

describe("PUT /api/sites/:siteId/nominal-instruments/:productId/:measurementDate", () => {
  it("rejects without permission", async () => {
    await expect(
      axios.put(`${bucharestUrl}/lidar/2024-06-01`, { instrumentInfoUuid: ubbChm15k }, { auth: nopermCreds }),
    ).rejects.toMatchObject({ response: { status: 401 } });
  });

  it("changes instrument", async () => {
    const res = await axios.put(
      `${bucharestUrl}/lidar/2024-06-01`,
      { instrumentInfoUuid: ubbChm15k },
      { auth: managerCreds },
    );
    expect(res.data).toMatchObject({ measurementDate: "2024-06-01", nominalInstrument: { uuid: ubbChm15k } });
    const lookup = await axios.get(lookupUrl, { params: { site: "bucharest", product: "lidar", date: "2024-09-01" } });
    expect(lookup.data).toMatchObject({ nominalInstrument: { uuid: ubbChm15k } });
  });

  it("rejects incompatible instrument", async () => {
    await expect(
      axios.put(`${bucharestUrl}/lidar/2024-06-01`, { instrumentInfoUuid: ubbHatpro }, { auth: managerCreds }),
    ).rejects.toMatchObject({ response: { status: 400 } });
  });

  it("accepts no-op save even when neighbours already match", async () => {
    const repo = dataSource.getRepository(NominalInstrument);
    await repo.insert({
      siteId: "bucharest",
      productId: "lidar",
      measurementDate: "2024-03-01",
      instrumentInfo: { uuid: bucharestChm15k } as any,
    });
    const res = await axios.put(
      `${bucharestUrl}/lidar/2024-03-01`,
      { instrumentInfoUuid: bucharestChm15k, measurementDate: "2024-03-01" },
      { auth: managerCreds },
    );
    expect(res.status).toBe(200);
    await repo.delete({ siteId: "bucharest", productId: "lidar", measurementDate: "2024-03-01" });
  });

  it("rejects calendar-invalid date in path", async () => {
    await expect(
      axios.put(`${bucharestUrl}/lidar/2024-02-30`, { instrumentInfoUuid: ubbChm15k }, { auth: managerCreds }),
    ).rejects.toMatchObject({ response: { status: 400 } });
    await expect(axios.delete(`${bucharestUrl}/lidar/2024-02-30`, { auth: managerCreds })).rejects.toMatchObject({
      response: { status: 400 },
    });
  });

  it("rejects changing instrument to match the previous entry", async () => {
    await expect(
      axios.put(`${bucharestUrl}/lidar/2024-06-01`, { instrumentInfoUuid: bucharestChm15k }, { auth: managerCreds }),
    ).rejects.toMatchObject({ response: { status: 409 } });
  });

  it("moves date", async () => {
    const res = await axios.put(
      `${bucharestUrl}/lidar/2024-06-01`,
      { measurementDate: "2024-07-01" },
      { auth: managerCreds },
    );
    expect(res.data).toMatchObject({ measurementDate: "2024-07-01", nominalInstrument: { uuid: ubbChm15k } });
    const list = await axios.get(bucharestUrl);
    expect(list.data.map((row: any) => `${row.productId}/${row.measurementDate}`)).toEqual([
      "lidar/2024-07-01",
      "lidar/2024-01-01",
      "radar/2024-01-01",
    ]);
  });

  it("rejects moving onto an existing date", async () => {
    await expect(
      axios.put(`${bucharestUrl}/lidar/2024-07-01`, { measurementDate: "2024-01-01" }, { auth: managerCreds }),
    ).rejects.toMatchObject({ response: { status: 409 } });
  });

  it("returns 404 for unknown entry", async () => {
    await expect(
      axios.put(`${bucharestUrl}/lidar/2024-06-01`, { instrumentInfoUuid: ubbChm15k }, { auth: managerCreds }),
    ).rejects.toMatchObject(genResponse(404, { status: 404, errors: "Nominal instrument not found" }));
  });
});

describe("DELETE /api/sites/:siteId/nominal-instruments/:productId/:measurementDate", () => {
  it("rejects without permission", async () => {
    await expect(axios.delete(`${bucharestUrl}/lidar/2024-07-01`, { auth: nopermCreds })).rejects.toMatchObject({
      response: { status: 401 },
    });
  });

  it("deletes entry", async () => {
    const res = await axios.delete(`${bucharestUrl}/lidar/2024-07-01`, { auth: managerCreds });
    expect(res.status).toBe(204);
    await expect(axios.delete(`${bucharestUrl}/lidar/2024-07-01`, { auth: managerCreds })).rejects.toMatchObject({
      response: { status: 404 },
    });
    const lookup = await axios.get(lookupUrl, { params: { site: "bucharest", product: "lidar", date: "2024-09-01" } });
    expect(lookup.data).toMatchObject({ measurementDate: "2024-01-01", nominalInstrument: { uuid: bucharestChm15k } });
  });
});

describe("GET /api/instrument-pids filters", () => {
  const uuids = (res: any) => res.data.map((row: any) => row.uuid).sort();

  it("filters by site uploads", async () => {
    const res = await axios.get(pidsUrl, { params: { site: "bucharest" } });
    expect(uuids(res)).toEqual([ubbHatpro, bucharestMira, bucharestChm15k, ubbChm15k].sort());
    expect(res.data[0].instrument).toBeDefined();
  });

  it("filters by compatible product", async () => {
    const res = await axios.get(pidsUrl, { params: { product: "lidar" } });
    expect(uuids(res)).toEqual([bucharestChm15k, ubbChm15k].sort());
  });

  it("combines filters", async () => {
    const res = await axios.get(pidsUrl, { params: { site: "bucharest", product: "radar" } });
    expect(uuids(res)).toEqual([bucharestMira]);
  });

  it("rejects filters combined with includeSite", async () => {
    await expect(axios.get(pidsUrl, { params: { includeSite: true, site: "bucharest" } })).rejects.toMatchObject({
      response: { status: 400 },
    });
  });

  it("returns empty list for product without instruments", async () => {
    const res = await axios.get(pidsUrl, { params: { product: "l3-cf" } });
    expect(res.data).toEqual([]);
  });
});
