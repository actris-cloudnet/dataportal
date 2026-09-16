import axios from "axios";
import { DataSource, Repository } from "typeorm";
import { backendPublicUrl, genResponse, cleanRepos, loadFixture } from "../../lib";
import { UserAccount } from "../../../src/entity/UserAccount";
import { Permission, PermissionType } from "../../../src/entity/Permission";
import { Site } from "../../../src/entity/Site";
import { AppDataSource } from "../../../src/data-source";
import { describe, expect, it, beforeAll, afterAll, beforeEach } from "@jest/globals";

let dataSource: DataSource;
let siteRepo: Repository<Site>;

const url = `${backendPublicUrl}sites/bucharest/description`;
const managerCreds = { username: "description-manager", password: "hunter2" };
const nopermCreds = { username: "description-noperm", password: "hunter2" };

beforeAll(async () => {
  dataSource = await AppDataSource.initialize();
  await cleanRepos(dataSource);
  await loadFixture(dataSource, "0-model_citation");
  await loadFixture(dataSource, "0-regular_citation");
  await loadFixture(dataSource, "1-product");
  await loadFixture(dataSource, "1-site");
  siteRepo = dataSource.getRepository(Site);

  const userRepo = dataSource.getRepository(UserAccount);
  const permRepo = dataSource.getRepository(Permission);

  const manager = new UserAccount();
  manager.username = managerCreds.username;
  manager.setPassword(managerCreds.password);
  await userRepo.save(manager);

  const perm = new Permission();
  perm.permission = PermissionType.canManageSiteDescriptions;
  perm.site = null;
  perm.model = null;
  perm.userAccounts = [manager];
  await permRepo.save(perm);

  const noperm = new UserAccount();
  noperm.username = nopermCreds.username;
  noperm.setPassword(nopermCreds.password);
  await userRepo.save(noperm);
});

beforeEach(async () => {
  await siteRepo.update({ id: "bucharest" }, { description: null });
});

afterAll(async () => {
  await dataSource.destroy();
});

describe("PUT /api/sites/:siteId/description", () => {
  it("updates description with permission", async () => {
    const description = "Bucharest is a **city**.\n\n## Links\n\n- [Home](https://example.com)\n";
    const res = await axios.put(url, { description }, { auth: managerCreds });
    expect(res.status).toBe(200);
    expect(res.data).toEqual({ description });
    const site = await axios.get(`${backendPublicUrl}sites/bucharest`);
    expect(site.data.description).toBe(description);
  });

  it("clears description with null or blank string", async () => {
    await siteRepo.update({ id: "bucharest" }, { description: "Old" });
    await axios.put(url, { description: null }, { auth: managerCreds });
    expect((await siteRepo.findOneByOrFail({ id: "bucharest" })).description).toBeNull();
    await siteRepo.update({ id: "bucharest" }, { description: "Old" });
    await axios.put(url, { description: "  \n" }, { auth: managerCreds });
    expect((await siteRepo.findOneByOrFail({ id: "bucharest" })).description).toBeNull();
  });

  it("rejects non-string description", async () => {
    await expect(axios.put(url, { description: 123 }, { auth: managerCreds })).rejects.toMatchObject(
      genResponse(400, { status: 400, errors: ["description must be a string or null"] }),
    );
  });

  it("returns 404 for unknown site", async () => {
    await expect(
      axios.put(`${backendPublicUrl}sites/nonexistent/description`, { description: "x" }, { auth: managerCreds }),
    ).rejects.toMatchObject(genResponse(404, { status: 404, errors: ["No sites match this id"] }));
  });

  it("rejects unauthenticated request", async () => {
    await expect(axios.put(url, { description: "x" })).rejects.toMatchObject({ response: { status: 401 } });
    expect((await siteRepo.findOneByOrFail({ id: "bucharest" })).description).toBeNull();
  });

  it("rejects user without permission", async () => {
    await expect(axios.put(url, { description: "x" }, { auth: nopermCreds })).rejects.toMatchObject({
      response: { status: 401 },
    });
    expect((await siteRepo.findOneByOrFail({ id: "bucharest" })).description).toBeNull();
  });
});
