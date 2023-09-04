import axios from "axios";
import { DataSource } from "typeorm";
import { backendPublicUrl, genResponse, wait } from "../../lib";
import { UserAccount } from "../../../src/entity/UserAccount";
import { Permission, PermissionType } from "../../../src/entity/Permission";
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
    await userRepo.delete({});
    await permRepo.delete({});

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
    const body = { calibrationFactor: 0.5 };
    const config = {
      params: { instrumentPid: "https://hdl.handle.net/123/hyytiala-chm15k", date: "2021-01-01" },
      auth: { username: "asdasd", password: "asdksad" },
    };
    return expect(axios.put(url, body, config)).rejects.toMatchObject({ response: { status: 401 } });
  });

  it("requires valid instrument PID", async () => {
    return expect(
      axios.put(
        url,
        { calibrationFactor: 0.5 },
        { params: { instrumentPid: "kissa", date: "2021-01-01" }, auth: credentials },
      ),
    ).rejects.toMatchObject(genResponse(400, { status: 400, errors: "instrumentPid must be HTTPS" }));
  });

  it("inserts new calibration", async () => {
    await axios.put(
      url,
      { calibrationFactor: 0.5 },
      {
        params: { instrumentPid: "https://hdl.handle.net/123/hyytiala-chm15k", date: "2021-01-01" },
        auth: credentials,
      },
    );
    const res = await axios.get(url, {
      params: { instrumentPid: "https://hdl.handle.net/123/hyytiala-chm15k", date: "2021-01-01" },
    });
    expect(res.data.data).toEqual({ calibrationFactor: 0.5 });
    expect(res.data.updatedAt).toEqual(res.data.createdAt);
  });

  it("replaces previous calibration for same date", async () => {
    await axios.put(
      url,
      { calibrationFactor: 0.5 },
      {
        params: { instrumentPid: "https://hdl.handle.net/123/hyytiala-chm15k", date: "2021-01-01" },
        auth: credentials,
      },
    );
    await wait(1000);
    await axios.put(
      url,
      { calibrationFactor: 0.8 },
      {
        params: { instrumentPid: "https://hdl.handle.net/123/hyytiala-chm15k", date: "2021-01-01" },
        auth: credentials,
      },
    );
    const res = await axios.get(url, {
      params: { instrumentPid: "https://hdl.handle.net/123/hyytiala-chm15k", date: "2021-01-01" },
    });
    expect(res.data.data).toEqual({ calibrationFactor: 0.8 });
    expect(res.data.updatedAt).not.toEqual(res.data.createdAt);
  });
});
