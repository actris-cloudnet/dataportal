import axios from "axios";
import { DataSource, Repository } from "typeorm";
import { backendPublicUrl, genResponse } from "../../lib";
import { UserAccount } from "../../../src/entity/UserAccount";
import { InstrumentLog } from "../../../src/entity/InstrumentLog";
import { InstrumentLogImage } from "../../../src/entity/InstrumentLogImage";
import { InstrumentLogPermission, InstrumentLogPermissionType } from "../../../src/entity/InstrumentLogPermission";
import { InstrumentInfo } from "../../../src/entity/Instrument";
import { AppDataSource } from "../../../src/data-source";
import { describe, expect, it, beforeAll, afterAll } from "@jest/globals";

let dataSource: DataSource;
let logRepo: Repository<InstrumentLog>;
let imageRepo: Repository<InstrumentLogImage>;

const url = `${backendPublicUrl}instrument-logs`;
const instrumentInfoUuid = "c43e9f54-c94d-45f7-8596-223b1c2b14c0";
const otherInstrumentInfoUuid = "0b3a7fa0-4812-4964-af23-1162e8b3a665";
let instrumentPid: string;
const writerCreds = { username: "logwriter", password: "hunter2" };
const readerCreds = { username: "logreader", password: "hunter2" };
const nopermCreds = { username: "lognoperm", password: "hunter2" };

beforeAll(async () => {
  dataSource = await AppDataSource.initialize();
  logRepo = dataSource.getRepository(InstrumentLog);
  imageRepo = dataSource.getRepository(InstrumentLogImage);
  const userRepo = dataSource.getRepository(UserAccount);
  const permRepo = dataSource.getRepository(InstrumentLogPermission);
  const instrumentInfoRepo = dataSource.getRepository(InstrumentInfo);

  await logRepo.createQueryBuilder().delete().execute();
  await permRepo.createQueryBuilder().delete().execute();
  await userRepo.createQueryBuilder().delete().execute();

  const instrumentInfo = await instrumentInfoRepo.findOneByOrFail({ uuid: instrumentInfoUuid });
  instrumentPid = instrumentInfo.pid;

  const writer = new UserAccount();
  writer.username = writerCreds.username;
  writer.setPassword(writerCreds.password);
  await userRepo.save(writer);

  const reader = new UserAccount();
  reader.username = readerCreds.username;
  reader.setPassword(readerCreds.password);
  await userRepo.save(reader);

  const noperm = new UserAccount();
  noperm.username = nopermCreds.username;
  noperm.setPassword(nopermCreds.password);
  await userRepo.save(noperm);

  const writePerm = new InstrumentLogPermission();
  writePerm.permission = InstrumentLogPermissionType.canWriteLogs;
  writePerm.instrumentInfo = instrumentInfo;
  writePerm.userAccounts = [writer];
  await permRepo.save(writePerm);

  const readPerm = new InstrumentLogPermission();
  readPerm.permission = InstrumentLogPermissionType.canReadLogs;
  readPerm.instrumentInfo = instrumentInfo;
  readPerm.userAccounts = [reader];
  await permRepo.save(readPerm);
});

afterAll(async () => await dataSource.destroy());

describe("GET /api/instrument-logs", () => {
  it("requires instrumentInfoUuid or instrumentPid parameter", async () => {
    return expect(axios.get(url, { auth: writerCreds })).rejects.toMatchObject(
      genResponse(400, { status: 400, errors: "instrumentInfoUuid or instrumentPid is required" }),
    );
  });

  it("rejects unknown instrument", async () => {
    return expect(
      axios.get(url, { params: { instrumentInfoUuid: "00000000-0000-0000-0000-000000000000" }, auth: writerCreds }),
    ).rejects.toMatchObject(genResponse(404, { status: 404, errors: "Instrument not found" }));
  });

  it("rejects user without permission", async () => {
    return expect(axios.get(url, { params: { instrumentInfoUuid }, auth: nopermCreds })).rejects.toMatchObject(
      genResponse(403, { status: 403, errors: "Missing permission" }),
    );
  });

  it("returns empty list initially", async () => {
    const res = await axios.get(url, { params: { instrumentInfoUuid }, auth: writerCreds });
    expect(res.data).toEqual([]);
  });

  it("allows reader to get logs", async () => {
    const res = await axios.get(url, { params: { instrumentInfoUuid }, auth: readerCreds });
    expect(res.data).toEqual([]);
  });

  it("accepts instrumentPid parameter", async () => {
    const res = await axios.get(url, { params: { instrumentPid }, auth: writerCreds });
    expect(res.data).toEqual([]);
  });

  it("rejects unknown instrumentPid", async () => {
    return expect(
      axios.get(url, { params: { instrumentPid: "https://hdl.handle.net/123/unknown" }, auth: writerCreds }),
    ).rejects.toMatchObject(genResponse(404, { status: 404, errors: "Instrument not found" }));
  });
});

describe("POST /api/instrument-logs", () => {
  it("rejects unauthenticated request", async () => {
    return expect(
      axios.post(url, { instrumentInfoUuid, eventType: "maintenance", date: "2021-01-01" }),
    ).rejects.toMatchObject({
      response: { status: 401 },
    });
  });

  it("rejects user without write permission", async () => {
    return expect(
      axios.post(url, { instrumentInfoUuid, eventType: "maintenance", date: "2021-01-01" }, { auth: readerCreds }),
    ).rejects.toMatchObject(genResponse(403, { status: 403, errors: "Missing permission" }));
  });

  it("rejects missing instrumentInfoUuid and instrumentPid", async () => {
    return expect(
      axios.post(url, { eventType: "maintenance", date: "2021-01-01" }, { auth: writerCreds }),
    ).rejects.toMatchObject(
      genResponse(400, { status: 400, errors: "instrumentInfoUuid or instrumentPid is required" }),
    );
  });

  it("accepts instrumentPid in body", async () => {
    const res = await axios.post(
      url,
      { instrumentPid, eventType: "maintenance", date: "2021-06-01", notes: "Test via pid" },
      { auth: writerCreds },
    );
    expect(res.status).toBe(201);
    expect(res.data.instrumentInfoUuid).toBe(instrumentInfoUuid);
  });

  it("rejects invalid eventType", async () => {
    return expect(
      axios.post(url, { instrumentInfoUuid, eventType: "invalid", date: "2021-01-01" }, { auth: writerCreds }),
    ).rejects.toMatchObject(genResponse(400, { status: 400 }));
  });

  it("rejects invalid date", async () => {
    return expect(
      axios.post(url, { instrumentInfoUuid, eventType: "maintenance", date: "not-a-date" }, { auth: writerCreds }),
    ).rejects.toMatchObject(genResponse(400, { status: 400 }));
  });

  it("rejects future date", async () => {
    return expect(
      axios.post(url, { instrumentInfoUuid, eventType: "maintenance", date: "2099-01-01" }, { auth: writerCreds }),
    ).rejects.toMatchObject(genResponse(400, { status: 400, errors: "date cannot be in the future" }));
  });

  it("rejects future endDate", async () => {
    return expect(
      axios.post(
        url,
        { instrumentInfoUuid, eventType: "maintenance", date: "2021-06-01", endDate: "2099-01-01" },
        { auth: writerCreds },
      ),
    ).rejects.toMatchObject(genResponse(400, { status: 400, errors: "endDate cannot be in the future" }));
  });

  it("rejects endDate before date", async () => {
    return expect(
      axios.post(
        url,
        { instrumentInfoUuid, eventType: "maintenance", date: "2021-06-01", endDate: "2021-05-01" },
        { auth: writerCreds },
      ),
    ).rejects.toMatchObject(genResponse(400, { status: 400, errors: "endDate cannot be before date" }));
  });

  it("requires notes for 'note' eventType", async () => {
    return expect(
      axios.post(url, { instrumentInfoUuid, eventType: "note", date: "2021-01-01" }, { auth: writerCreds }),
    ).rejects.toMatchObject(genResponse(400, { status: 400, errors: "notes are required for this event type" }));
  });

  it("requires valid result for 'check' eventType", async () => {
    return expect(
      axios.post(url, { instrumentInfoUuid, eventType: "check", date: "2021-01-01" }, { auth: writerCreds }),
    ).rejects.toMatchObject(genResponse(400, { status: 400 }));
  });

  it("creates a log entry", async () => {
    const body = {
      instrumentInfoUuid,
      eventType: "maintenance",
      date: "2021-06-01",
      notes: "Routine maintenance",
    };
    const res = await axios.post(url, body, { auth: writerCreds });
    expect(res.status).toBe(201);
    expect(res.data).toMatchObject({
      id: expect.any(Number),
      instrumentInfoUuid,
      eventType: "maintenance",
      date: expect.stringContaining("2021-06-01"),
      notes: "Routine maintenance",
    });
  });

  it("creates a log entry with endDate", async () => {
    const body = {
      instrumentInfoUuid,
      eventType: "maintenance",
      date: "2021-07-01",
      endDate: "2021-07-02",
    };
    const res = await axios.post(url, body, { auth: writerCreds });
    expect(res.status).toBe(201);
    expect(res.data.endDate).toContain("2021-07-02");
  });

  it("creates a check entry with result", async () => {
    const body = {
      instrumentInfoUuid,
      eventType: "check",
      date: "2021-08-01",
      result: "OK",
    };
    const res = await axios.post(url, body, { auth: writerCreds });
    expect(res.status).toBe(201);
    expect(res.data.result).toBe("OK");
  });

  it("creates a note entry with required notes", async () => {
    const body = {
      instrumentInfoUuid,
      eventType: "note",
      date: "2021-09-01",
      notes: "Important observation",
    };
    const res = await axios.post(url, body, { auth: writerCreds });
    expect(res.status).toBe(201);
    expect(res.data.eventType).toBe("note");
    expect(res.data.notes).toBe("Important observation");
  });
});

describe("GET /api/instrument-logs (with data)", () => {
  it("returns created log entries sorted by date DESC", async () => {
    const res = await axios.get(url, { params: { instrumentInfoUuid }, auth: writerCreds });
    expect(res.data.length).toBe(5);
    expect(res.data[0].eventType).toBe("note");
    expect(res.data[1].eventType).toBe("check");
    const dates = res.data.map((entry: any) => entry.date);
    for (let i = 0; i < dates.length - 1; i++) {
      expect(new Date(dates[i]).getTime()).toBeGreaterThanOrEqual(new Date(dates[i + 1]).getTime());
    }
  });

  it("includes createdBy info", async () => {
    const res = await axios.get(url, { params: { instrumentInfoUuid }, auth: writerCreds });
    expect(res.data[0].createdBy).toMatchObject({
      id: expect.any(Number),
      username: writerCreds.username,
    });
  });
});

describe("PUT /api/instrument-logs/:id", () => {
  let logId: number;

  beforeAll(async () => {
    const res = await axios.get(url, { params: { instrumentInfoUuid }, auth: writerCreds });
    logId = res.data[0].id;
  });

  it("rejects invalid id", async () => {
    return expect(
      axios.put(`${url}/abc`, { eventType: "maintenance", date: "2021-01-01" }, { auth: writerCreds }),
    ).rejects.toMatchObject(genResponse(400, { status: 400, errors: "Invalid log entry id" }));
  });

  it("rejects nonexistent id", async () => {
    return expect(
      axios.put(`${url}/999999`, { eventType: "maintenance", date: "2021-01-01" }, { auth: writerCreds }),
    ).rejects.toMatchObject(genResponse(404, { status: 404, errors: "Log entry not found" }));
  });

  it("rejects user without write permission", async () => {
    return expect(
      axios.put(`${url}/${logId}`, { eventType: "maintenance", date: "2021-01-01" }, { auth: readerCreds }),
    ).rejects.toMatchObject(genResponse(403, { status: 403, errors: "Missing permission" }));
  });

  it("rejects invalid body", async () => {
    return expect(
      axios.put(`${url}/${logId}`, { eventType: "invalid", date: "2021-01-01" }, { auth: writerCreds }),
    ).rejects.toMatchObject(genResponse(400, { status: 400 }));
  });

  it("updates a log entry", async () => {
    const body = {
      eventType: "maintenance",
      date: "2021-09-15",
      notes: "Updated notes",
    };
    const res = await axios.put(`${url}/${logId}`, body, { auth: writerCreds });
    expect(res.status).toBe(200);
    expect(res.data).toMatchObject({
      id: logId,
      eventType: "maintenance",
      notes: "Updated notes",
    });
    expect(res.data.updatedAt).not.toBeNull();
  });
});

describe("DELETE /api/instrument-logs/:id", () => {
  let logId: number;

  beforeAll(async () => {
    const body = {
      instrumentInfoUuid,
      eventType: "maintenance",
      date: "2021-10-01",
      notes: "To be deleted",
    };
    const res = await axios.post(url, body, { auth: writerCreds });
    logId = res.data.id;
  });

  it("rejects user without write permission", async () => {
    return expect(axios.delete(`${url}/${logId}`, { auth: readerCreds })).rejects.toMatchObject(
      genResponse(403, { status: 403, errors: "Missing permission" }),
    );
  });

  it("rejects nonexistent id", async () => {
    return expect(axios.delete(`${url}/999999`, { auth: writerCreds })).rejects.toMatchObject(
      genResponse(404, { status: 404, errors: "Log entry not found" }),
    );
  });

  it("deletes a log entry", async () => {
    const res = await axios.delete(`${url}/${logId}`, { auth: writerCreds });
    expect(res.status).toBe(204);
  });

  it("confirms entry is deleted", async () => {
    return expect(
      axios.put(`${url}/${logId}`, { eventType: "maintenance", date: "2021-01-01" }, { auth: writerCreds }),
    ).rejects.toMatchObject(genResponse(404, { status: 404, errors: "Log entry not found" }));
  });
});

describe("POST /api/instrument-logs/:id/images", () => {
  let logId: number;
  const imageData = Buffer.from("fake-png-image-data");

  beforeAll(async () => {
    const body = {
      instrumentInfoUuid,
      eventType: "maintenance",
      date: "2021-11-01",
      notes: "Entry for image tests",
    };
    const res = await axios.post(url, body, { auth: writerCreds });
    logId = res.data.id;
  });

  it("rejects unauthenticated request", async () => {
    return expect(
      axios.post(`${url}/${logId}/images?filename=test.jpg`, imageData, {
        headers: { "Content-Type": "image/jpeg" },
      }),
    ).rejects.toMatchObject({ response: { status: 401 } });
  });

  it("rejects user without write permission", async () => {
    return expect(
      axios.post(`${url}/${logId}/images?filename=test.jpg`, imageData, {
        auth: readerCreds,
        headers: { "Content-Type": "image/jpeg" },
      }),
    ).rejects.toMatchObject(genResponse(403, { status: 403, errors: "Missing permission" }));
  });

  it("rejects invalid content type", async () => {
    return expect(
      axios.post(`${url}/${logId}/images?filename=test.txt`, imageData, {
        auth: writerCreds,
        headers: { "Content-Type": "text/plain" },
      }),
    ).rejects.toMatchObject(
      genResponse(400, { status: 400, errors: "Content-Type must be image/jpeg, image/png, or image/webp" }),
    );
  });

  it("rejects nonexistent log entry", async () => {
    return expect(
      axios.post(`${url}/999999/images?filename=test.jpg`, imageData, {
        auth: writerCreds,
        headers: { "Content-Type": "image/jpeg" },
      }),
    ).rejects.toMatchObject(genResponse(404, { status: 404, errors: "Log entry not found" }));
  });

  it("uploads an image", async () => {
    const res = await axios.post(`${url}/${logId}/images?filename=photo.jpg`, imageData, {
      auth: writerCreds,
      headers: { "Content-Type": "image/jpeg" },
    });
    expect(res.status).toBe(201);
    expect(res.data).toMatchObject({
      id: expect.any(Number),
      filename: "photo.jpg",
      size: expect.any(Number),
    });
  });

  it("uploads a second image", async () => {
    const res = await axios.post(`${url}/${logId}/images?filename=photo2.png`, imageData, {
      auth: writerCreds,
      headers: { "Content-Type": "image/png" },
    });
    expect(res.status).toBe(201);
    expect(res.data.filename).toBe("photo2.png");
  });

  it("includes images in log listing", async () => {
    const res = await axios.get(url, { params: { instrumentInfoUuid }, auth: writerCreds });
    const entry = res.data.find((e: any) => e.id === logId);
    expect(entry.images).toHaveLength(2);
    expect(entry.images[0]).toMatchObject({
      id: expect.any(Number),
      filename: expect.any(String),
    });
    expect(Number(entry.images[0].size)).toBeGreaterThan(0);
  });
});

describe("GET /api/instrument-logs/:id/images/:imageId", () => {
  let logId: number;
  let imageId: number;

  beforeAll(async () => {
    const res = await axios.get(url, { params: { instrumentInfoUuid }, auth: writerCreds });
    const entry = res.data.find((e: any) => e.images.length > 0);
    logId = entry.id;
    imageId = entry.images[0].id;
  });

  it("rejects unauthenticated request", async () => {
    return expect(axios.get(`${url}/${logId}/images/${imageId}`)).rejects.toMatchObject({
      response: { status: 401 },
    });
  });

  it("rejects user without permission", async () => {
    return expect(axios.get(`${url}/${logId}/images/${imageId}`, { auth: nopermCreds })).rejects.toMatchObject(
      genResponse(403, { status: 403, errors: "Missing permission" }),
    );
  });

  it("returns 404 for nonexistent image", async () => {
    return expect(axios.get(`${url}/${logId}/images/999999`, { auth: writerCreds })).rejects.toMatchObject(
      genResponse(404, { status: 404, errors: "Image not found" }),
    );
  });

  it("downloads the image as writer", async () => {
    const res = await axios.get(`${url}/${logId}/images/${imageId}`, {
      auth: writerCreds,
      responseType: "arraybuffer",
    });
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toBe("image/jpeg");
    expect(res.data.length).toBeGreaterThan(0);
  });

  it("downloads the image as reader", async () => {
    const res = await axios.get(`${url}/${logId}/images/${imageId}`, {
      auth: readerCreds,
      responseType: "arraybuffer",
    });
    expect(res.status).toBe(200);
  });
});

describe("DELETE /api/instrument-logs/:id/images/:imageId", () => {
  let logId: number;
  let imageId: number;

  beforeAll(async () => {
    const res = await axios.get(url, { params: { instrumentInfoUuid }, auth: writerCreds });
    const entry = res.data.find((e: any) => e.images.length > 0);
    logId = entry.id;
    imageId = entry.images[0].id;
  });

  it("rejects user without write permission", async () => {
    return expect(axios.delete(`${url}/${logId}/images/${imageId}`, { auth: readerCreds })).rejects.toMatchObject(
      genResponse(403, { status: 403, errors: "Missing permission" }),
    );
  });

  it("returns 404 for nonexistent image", async () => {
    return expect(axios.delete(`${url}/${logId}/images/999999`, { auth: writerCreds })).rejects.toMatchObject(
      genResponse(404, { status: 404, errors: "Image not found" }),
    );
  });

  it("deletes an image", async () => {
    const res = await axios.delete(`${url}/${logId}/images/${imageId}`, { auth: writerCreds });
    expect(res.status).toBe(204);
  });

  it("confirms image is deleted from DB", async () => {
    const image = await imageRepo.findOneBy({ id: imageId });
    expect(image).toBeNull();
  });

  it("confirms image is removed from listing", async () => {
    const res = await axios.get(url, { params: { instrumentInfoUuid }, auth: writerCreds });
    const entry = res.data.find((e: any) => e.id === logId);
    const ids = entry.images.map((img: any) => img.id);
    expect(ids).not.toContain(imageId);
  });
});

describe("cascade delete: deleting log entry removes images", () => {
  it("deletes log entry with images and confirms images are removed", async () => {
    const body = {
      instrumentInfoUuid,
      eventType: "maintenance",
      date: "2021-12-01",
    };
    const logRes = await axios.post(url, body, { auth: writerCreds });
    const logId = logRes.data.id;
    const imgRes = await axios.post(`${url}/${logId}/images?filename=cascade.jpg`, Buffer.from("cascade-test"), {
      auth: writerCreds,
      headers: { "Content-Type": "image/jpeg" },
    });
    const imageId = imgRes.data.id;
    await axios.delete(`${url}/${logId}`, { auth: writerCreds });
    const image = await imageRepo.findOneBy({ id: imageId });
    expect(image).toBeNull();
  });
});
