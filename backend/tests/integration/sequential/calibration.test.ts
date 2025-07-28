import axios from "axios";
import { DataSource } from "typeorm";
import { backendPublicUrl, genResponse } from "../../lib";
import { UserAccount } from "../../../src/entity/UserAccount";
import { Permission, PermissionType } from "../../../src/entity/Permission";
import { Calibration } from "../../../src/entity/Calibration";
import { AppDataSource } from "../../../src/data-source";
import { describe, expect, it, beforeAll, afterAll } from "@jest/globals";

let dataSource: DataSource;
const url = `${backendPublicUrl}calibration/`;
const credentials = { username: "calibrator", password: "hunter2" };

describe("PUT /api/calibration", () => {
  beforeAll(async () => {
    dataSource = await AppDataSource.initialize();
    const userRepo = dataSource.getRepository(UserAccount);
    const permRepo = dataSource.getRepository(Permission);
    const calibRepo = dataSource.getRepository(Calibration);
    await userRepo.createQueryBuilder().delete().execute();
    await permRepo.createQueryBuilder().delete().execute();
    await calibRepo.createQueryBuilder().delete().execute();

    const user = new UserAccount();
    user.username = credentials.username;
    user.setPassword(credentials.password);
    await userRepo.save(user);

    const perm = new Permission();
    perm.permission = PermissionType.canCalibrate;
    perm.userAccounts = [user];
    await permRepo.save(perm);
  });

  afterAll(async () => await dataSource.destroy());

  it("requires correct credentials", async () => {
    const body = { calibration_factor: 0.5 };
    const config = {
      params: { instrumentPid: "https://hdl.handle.net/123/bucharest-chm15k", date: "2021-01-01" },
      auth: { username: "asdasd", password: "asdksad" },
    };
    return expect(axios.put(url, body, config)).rejects.toMatchObject({ response: { status: 401 } });
  });

  it("requires valid instrument PID", async () => {
    return expect(
      axios.put(
        url,
        { calibration_factor: 0.5 },
        { params: { instrumentPid: "kissa", date: "2021-01-01" }, auth: credentials },
      ),
    ).rejects.toMatchObject(genResponse(400, { status: 400, errors: "Instrument not found" }));
  });

  it("inserts new calibration", async () => {
    await axios.put(
      url,
      { calibration_factor: 0.5, time_offset: 120 },
      {
        params: { instrumentPid: "https://hdl.handle.net/123/bucharest-chm15k", date: "2021-01-01" },
        auth: credentials,
      },
    );
    const resDay = await axios.get(url, {
      params: { instrumentPid: "https://hdl.handle.net/123/bucharest-chm15k", date: "2021-01-01" },
    });
    expect(resDay.data.data).toEqual({ calibration_factor: 0.5, time_offset: 120 });
    const resAll = await axios.get(url, {
      params: { instrumentPid: "https://hdl.handle.net/123/bucharest-chm15k" },
    });
    expect(resAll.data.calibration_factor).toHaveLength(1);
    expect(resAll.data.calibration_factor[0].createdAt).toBe(resAll.data.calibration_factor[0].updatedAt);
    expect(resAll.data.time_offset).toHaveLength(1);
  });

  it("replaces previous calibration for same date", async () => {
    await axios.put(
      url,
      { calibration_factor: 0.8 },
      {
        params: { instrumentPid: "https://hdl.handle.net/123/bucharest-chm15k", date: "2021-01-01" },
        auth: credentials,
      },
    );
    const resDay = await axios.get(url, {
      params: { instrumentPid: "https://hdl.handle.net/123/bucharest-chm15k", date: "2021-01-01" },
    });
    expect(resDay.data.data).toEqual({ calibration_factor: 0.8, time_offset: 120 });
    const resAll = await axios.get(url, {
      params: { instrumentPid: "https://hdl.handle.net/123/bucharest-chm15k" },
    });
    expect(resAll.data.calibration_factor).toHaveLength(1);
    expect(resAll.data.calibration_factor[0].createdAt < resAll.data.calibration_factor[0].updatedAt).toBeTruthy();
    expect(resAll.data.time_offset).toHaveLength(1);
  });

  it("updates calibration for the next date", async () => {
    await axios.put(
      url,
      { calibration_factor: 0.15 },
      {
        params: { instrumentPid: "https://hdl.handle.net/123/bucharest-chm15k", date: "2021-01-02" },
        auth: credentials,
      },
    );
    const resDay = await axios.get(url, {
      params: { instrumentPid: "https://hdl.handle.net/123/bucharest-chm15k", date: "2021-01-02" },
    });
    expect(resDay.data.data).toEqual({ calibration_factor: 0.15, time_offset: 120 });
    const resAll = await axios.get(url, {
      params: { instrumentPid: "https://hdl.handle.net/123/bucharest-chm15k" },
    });
    expect(resAll.data.calibration_factor).toHaveLength(2);
    expect(resAll.data.calibration_factor[0].data).toBe(0.8);
    expect(resAll.data.calibration_factor[1].data).toBe(0.15);
    expect(resAll.data.time_offset).toHaveLength(1);
  });
});
