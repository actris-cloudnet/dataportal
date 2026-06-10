import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import { DataSource, Repository } from "typeorm";
import { AppDataSource } from "../../../src/data-source";
import { UserAccount } from "../../../src/entity/UserAccount";
import { Person } from "../../../src/entity/Person";
import { Authenticator } from "../../../src/lib/auth";
import { InstrumentContact } from "../../../src/entity/InstrumentContact";
import { cleanRepos } from "../../lib";
import { afterEach } from "node:test";
import { Instrument, InstrumentInfo } from "../../../src/entity/Instrument";

let dataSource: DataSource;
let userRepo: Repository<UserAccount>;
let personRepo: Repository<Person>;
let instrumentContactRepo: Repository<InstrumentContact>;
let authenticator: Authenticator;

beforeAll(async () => {
  dataSource = await AppDataSource.initialize();
  await cleanRepos(dataSource);

  const instrument = await dataSource.getRepository(Instrument).save({
    id: "test-instrument",
    type: "lidar" as any,
    humanReadableName: "Test Instrument",
  });
  await dataSource.getRepository(InstrumentInfo).save({
    uuid: "c43e9f54-c94d-45f7-8596-223b1c2b14c0",
    pid: "https://hdl.handle.net/test-instrument",
    name: "Test Instrument",
    instrument,
    owners: ["Test Owner"],
    model: "Test Model",
    type: "test",
  });

  userRepo = dataSource.getRepository(UserAccount);
  personRepo = dataSource.getRepository(Person);
  instrumentContactRepo = dataSource.getRepository(InstrumentContact);
  authenticator = new Authenticator(dataSource);
});

afterEach(async () => {
  await instrumentContactRepo.deleteAll();
  await personRepo.deleteAll();
  await userRepo.deleteAll();
});

afterAll(async () => {
  await dataSource.destroy();
});

describe("ORCID login", () => {
  describe("login by approved user", () => {
    it("throws error when ORCID is missing", async () => {
      const params = { name: "Test User" };
      await expect(authenticator.orcidLogin(params)).rejects.toThrow("Failed to get ORCID iD");
    });

    it("prevents login by unknown user", async () => {
      const orcidId = "0000-0000-0000-UNKNOWN";
      const fullName = "Random User";

      const params = { orcid: orcidId, name: fullName };
      const result = await authenticator.orcidLogin(params);

      expect(result).toBe(false);
    });

    it("allows known user", async () => {
      const orcidId = "0000-0000-0000-KNOWN";

      const person = await personRepo.save({ orcid: orcidId, firstName: "Known", lastName: "User" });
      const user = await userRepo.save({ person });

      const params = { orcid: orcidId };
      const result = await authenticator.orcidLogin(params);
      expect(result).not.toBe(false);
      expect((result as UserAccount).id).toBe(user.id);
    });
  });

  describe("login by instrument contact", () => {
    it("creates new user for existing instrument contact", async () => {
      const orcidId = "0000-0000-0000-PICARD";

      const person = await personRepo.save({ firstName: "Jean-Luc", lastName: "Picard", orcid: orcidId });
      await instrumentContactRepo.save({
        instrumentInfoUuid: "c43e9f54-c94d-45f7-8596-223b1c2b14c0",
        person,
        startDate: "2020-01-01",
        endDate: null,
        createdAt: new Date(),
      });

      const params = { orcid: orcidId };
      const result = await authenticator.orcidLogin(params);
      expect(result).not.toBe(false);
      expect((result as UserAccount).personId).toBe(person.id);
    });

    it("returns false for person without active instrument contact", async () => {
      const orcidId = "0000-0000-0000-NOCONTACT";

      await personRepo.save({ firstName: "No", lastName: "Contacts", orcid: orcidId });

      const params = { orcid: orcidId };
      const result = await authenticator.orcidLogin(params);
      expect(result).toBe(false);
    });

    it("returns false for expired instrument contact", async () => {
      const orcidId = "0000-0000-0000-EXPIRED";

      const person = await personRepo.save({ firstName: "Expired", lastName: "Contact", orcid: orcidId });
      await instrumentContactRepo.save({
        instrumentInfoUuid: "c43e9f54-c94d-45f7-8596-223b1c2b14c0",
        person,
        startDate: "2020-01-01",
        endDate: "2023-12-31",
        createdAt: new Date(),
      });

      const params = { orcid: orcidId };
      const result = await authenticator.orcidLogin(params);
      expect(result).toBe(false);
    });
  });
});
