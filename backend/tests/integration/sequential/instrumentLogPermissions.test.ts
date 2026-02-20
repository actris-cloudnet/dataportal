import axios from "axios";
import { DataSource } from "typeorm";
import { backendPublicUrl, backendPrivateUrl, genResponse } from "../../lib";
import { UserAccount } from "../../../src/entity/UserAccount";
import { InstrumentLog } from "../../../src/entity/InstrumentLog";
import { InstrumentLogPermission } from "../../../src/entity/InstrumentLogPermission";
import { AppDataSource } from "../../../src/data-source";
import { describe, expect, it, beforeAll, afterAll } from "@jest/globals";

let dataSource: DataSource;

const url = `${backendPublicUrl}instrument-logs`;
const userAccountsUrl = `${backendPrivateUrl}user-accounts`;
const instrumentInfoUuid = "c43e9f54-c94d-45f7-8596-223b1c2b14c0";
const otherInstrumentInfoUuid = "0b3a7fa0-4812-4964-af23-1162e8b3a665";

const globalReaderCreds = { username: "perm_globalreader", password: "hunter2" };
const globalWriterCreds = { username: "perm_globalwriter", password: "hunter2" };
const specificReaderCreds = { username: "perm_specificreader", password: "hunter2" };

beforeAll(async () => {
  dataSource = await AppDataSource.initialize();

  await dataSource.getRepository(InstrumentLog).createQueryBuilder().delete().execute();
  await dataSource.getRepository(InstrumentLogPermission).createQueryBuilder().delete().execute();
  await dataSource.getRepository(UserAccount).createQueryBuilder().delete().execute();

  await axios.post(userAccountsUrl, {
    username: globalReaderCreds.username,
    password: globalReaderCreds.password,
    permissions: [],
    instrumentLogPermissions: [{ permission: "canReadLogs", instrumentInfoUuid: null }],
  });

  await axios.post(userAccountsUrl, {
    username: globalWriterCreds.username,
    password: globalWriterCreds.password,
    permissions: [],
    instrumentLogPermissions: [{ permission: "canWriteLogs", instrumentInfoUuid: null }],
  });

  await axios.post(userAccountsUrl, {
    username: specificReaderCreds.username,
    password: specificReaderCreds.password,
    permissions: [],
    instrumentLogPermissions: [{ permission: "canReadLogs", instrumentInfoUuid }],
  });

  // Seed one log entry per instrument via the API so GET returns data
  await axios.post(
    url,
    { instrumentInfoUuid, eventType: "maintenance", date: "2020-01-01" },
    { auth: globalWriterCreds },
  );
  await axios.post(
    url,
    { instrumentInfoUuid: otherInstrumentInfoUuid, eventType: "maintenance", date: "2020-01-01" },
    { auth: globalWriterCreds },
  );
});

afterAll(async () => await dataSource.destroy());

describe("Global canReadLogs", () => {
  it("can read logs for the primary instrument", async () => {
    const res = await axios.get(url, { params: { instrumentInfoUuid }, auth: globalReaderCreds });
    expect(res.status).toBe(200);
    expect(res.data.length).toBeGreaterThan(0);
  });

  it("can read logs for a different instrument", async () => {
    const res = await axios.get(url, {
      params: { instrumentInfoUuid: otherInstrumentInfoUuid },
      auth: globalReaderCreds,
    });
    expect(res.status).toBe(200);
    expect(res.data.length).toBeGreaterThan(0);
  });

  it("cannot write logs", async () => {
    return expect(
      axios.post(
        url,
        { instrumentInfoUuid, eventType: "maintenance", date: "2020-06-01" },
        { auth: globalReaderCreds },
      ),
    ).rejects.toMatchObject(genResponse(403, { status: 403, errors: "Missing permission" }));
  });
});

describe("Global canWriteLogs", () => {
  it("can write logs for the primary instrument", async () => {
    const res = await axios.post(
      url,
      { instrumentInfoUuid, eventType: "maintenance", date: "2020-06-01" },
      { auth: globalWriterCreds },
    );
    expect(res.status).toBe(201);
  });

  it("can read logs for the primary instrument", async () => {
    const res = await axios.get(url, { params: { instrumentInfoUuid }, auth: globalWriterCreds });
    expect(res.status).toBe(200);
    expect(res.data.length).toBeGreaterThan(0);
  });

  it("can write logs for a different instrument", async () => {
    const res = await axios.post(
      url,
      { instrumentInfoUuid: otherInstrumentInfoUuid, eventType: "maintenance", date: "2020-06-01" },
      { auth: globalWriterCreds },
    );
    expect(res.status).toBe(201);
  });

  it("can read logs for a different instrument", async () => {
    const res = await axios.get(url, {
      params: { instrumentInfoUuid: otherInstrumentInfoUuid },
      auth: globalWriterCreds,
    });
    expect(res.status).toBe(200);
    expect(res.data.length).toBeGreaterThan(0);
  });
});

describe("Instrument-specific canReadLogs isolation", () => {
  it("can read logs for the permitted instrument", async () => {
    const res = await axios.get(url, { params: { instrumentInfoUuid }, auth: specificReaderCreds });
    expect(res.status).toBe(200);
  });

  it("cannot read logs for a different instrument", async () => {
    return expect(
      axios.get(url, { params: { instrumentInfoUuid: otherInstrumentInfoUuid }, auth: specificReaderCreds }),
    ).rejects.toMatchObject(genResponse(403, { status: 403, errors: "Missing permission" }));
  });
});

describe("Permission deduplication", () => {
  it("strips canReadLogs when canWriteLogs is given for the same global scope", async () => {
    const res = await axios.post(userAccountsUrl, {
      username: "perm_dedup_globalwrite",
      password: "hunter2",
      permissions: [],
      instrumentLogPermissions: [
        { permission: "canWriteLogs", instrumentInfoUuid: null },
        { permission: "canReadLogs", instrumentInfoUuid: null },
      ],
    });
    expect(res.status).toBe(201);
    const perms: { permission: string; instrumentInfoUuid: string | null }[] = res.data.instrumentLogPermissions;
    expect(perms).toHaveLength(1);
    expect(perms[0].permission).toBe("canWriteLogs");
    expect(perms[0].instrumentInfoUuid).toBeNull();
  });

  it("strips canReadLogs when canWriteLogs is given for the same instrument", async () => {
    const res = await axios.post(userAccountsUrl, {
      username: "perm_dedup_instrwrite",
      password: "hunter2",
      permissions: [],
      instrumentLogPermissions: [
        { permission: "canWriteLogs", instrumentInfoUuid },
        { permission: "canReadLogs", instrumentInfoUuid },
      ],
    });
    expect(res.status).toBe(201);
    const perms: { permission: string; instrumentInfoUuid: string | null }[] = res.data.instrumentLogPermissions;
    expect(perms).toHaveLength(1);
    expect(perms[0].permission).toBe("canWriteLogs");
    expect(perms[0].instrumentInfoUuid).toBe(instrumentInfoUuid);
  });

  it("strips instrument-specific canReadLogs when global canWriteLogs is present", async () => {
    const res = await axios.post(userAccountsUrl, {
      username: "perm_dedup_globalwrite_specificread",
      password: "hunter2",
      permissions: [],
      instrumentLogPermissions: [
        { permission: "canWriteLogs", instrumentInfoUuid: null },
        { permission: "canReadLogs", instrumentInfoUuid },
      ],
    });
    expect(res.status).toBe(201);
    const perms: { permission: string; instrumentInfoUuid: string | null }[] = res.data.instrumentLogPermissions;
    expect(perms).toHaveLength(1);
    expect(perms[0].permission).toBe("canWriteLogs");
    expect(perms[0].instrumentInfoUuid).toBeNull();
  });

  it("user with only canWriteLogs (after dedup) can still read logs", async () => {
    const creds = { username: "perm_dedup_globalwrite", password: "hunter2" };
    const res = await axios.get(url, { params: { instrumentInfoUuid }, auth: creds });
    expect(res.status).toBe(200);
  });
});
