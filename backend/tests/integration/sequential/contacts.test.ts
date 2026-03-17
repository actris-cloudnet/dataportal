import axios from "axios";
import { DataSource, Repository } from "typeorm";
import { backendPublicUrl, genResponse } from "../../lib";
import { UserAccount } from "../../../src/entity/UserAccount";
import { Permission, PermissionType } from "../../../src/entity/Permission";
import { SiteContact } from "../../../src/entity/SiteContact";
import { InstrumentContact } from "../../../src/entity/InstrumentContact";
import { Person } from "../../../src/entity/Person";
import { AppDataSource } from "../../../src/data-source";
import { describe, expect, it, beforeAll, afterAll } from "@jest/globals";

let dataSource: DataSource;
let contactRepo: Repository<SiteContact>;
let instrumentContactRepo: Repository<InstrumentContact>;
let personRepo: Repository<Person>;

const siteUrl = `${backendPublicUrl}sites/bucharest/contacts`;
const instrumentUuid = "c43e9f54-c94d-45f7-8596-223b1c2b14c0";
const instrumentUrl = `${backendPublicUrl}instrument-pids/${instrumentUuid}/contacts`;

const managerCreds = { username: "contact-manager", password: "hunter2" };
const nopermCreds = { username: "contact-noperm", password: "hunter2" };

beforeAll(async () => {
  dataSource = await AppDataSource.initialize();
  contactRepo = dataSource.getRepository(SiteContact);
  instrumentContactRepo = dataSource.getRepository(InstrumentContact);
  personRepo = dataSource.getRepository(Person);

  const userRepo = dataSource.getRepository(UserAccount);
  const permRepo = dataSource.getRepository(Permission);

  // Create user with canManageContacts
  const manager = new UserAccount();
  manager.username = managerCreds.username;
  manager.setPassword(managerCreds.password);
  await userRepo.save(manager);

  const contactPerm = new Permission();
  contactPerm.permission = PermissionType.canManageContacts;
  contactPerm.site = null;
  contactPerm.model = null;
  contactPerm.userAccounts = [manager];
  await permRepo.save(contactPerm);

  // Create user without permissions
  const noperm = new UserAccount();
  noperm.username = nopermCreds.username;
  noperm.setPassword(nopermCreds.password);
  await userRepo.save(noperm);
});

afterAll(async () => {
  await dataSource.destroy();
});

describe("GET /api/sites/:siteId/contacts", () => {
  it("returns fixture contacts for bucharest", async () => {
    const res = await axios.get(siteUrl);
    expect(res.status).toBe(200);
    expect(res.data).toHaveLength(1);
    expect(res.data[0]).toMatchObject({
      person: { firstName: "Benjamin", lastName: "Bucharinen" },
      startDate: null,
      endDate: null,
    });
  });

  it("returns 404 for unknown site", async () => {
    const url = `${backendPublicUrl}sites/nonexistent/contacts`;
    await expect(axios.get(url)).rejects.toMatchObject(
      genResponse(404, { status: 404, errors: ["No sites match this id"] }),
    );
  });

  it("hides email from unauthenticated users", async () => {
    const person = personRepo.create({ firstName: "Email", lastName: "Test", email: "email@example.com" });
    const saved = await personRepo.save(person);
    const contact = contactRepo.create({ siteId: "bucharest", personId: saved.id!, startDate: null, endDate: null });
    const savedContact = await contactRepo.save(contact);

    const res = await axios.get(siteUrl);
    const found = res.data.find((c: any) => c.id === savedContact.id);
    expect(found.person).not.toHaveProperty("email");

    await contactRepo.delete({ id: savedContact.id });
    await personRepo.delete({ id: saved.id! });
  });

  it("hides email from users without canManageContacts", async () => {
    const person = personRepo.create({ firstName: "Email2", lastName: "Test", email: "email2@example.com" });
    const saved = await personRepo.save(person);
    const contact = contactRepo.create({ siteId: "bucharest", personId: saved.id!, startDate: null, endDate: null });
    const savedContact = await contactRepo.save(contact);

    const res = await axios.get(siteUrl, { auth: nopermCreds });
    const found = res.data.find((c: any) => c.id === savedContact.id);
    expect(found.person).not.toHaveProperty("email");

    await contactRepo.delete({ id: savedContact.id });
    await personRepo.delete({ id: saved.id! });
  });

  it("shows email to users with canManageContacts", async () => {
    const person = personRepo.create({ firstName: "Email3", lastName: "Test", email: "email3@example.com" });
    const saved = await personRepo.save(person);
    const contact = contactRepo.create({ siteId: "bucharest", personId: saved.id!, startDate: null, endDate: null });
    const savedContact = await contactRepo.save(contact);

    const res = await axios.get(siteUrl, { auth: managerCreds });
    const found = res.data.find((c: any) => c.id === savedContact.id);
    expect(found.person.email).toBe("email3@example.com");

    await contactRepo.delete({ id: savedContact.id });
    await personRepo.delete({ id: saved.id! });
  });
});

describe("POST /api/sites/:siteId/contacts", () => {
  it("rejects without auth", async () => {
    await expect(axios.post(siteUrl, { firstName: "Test", lastName: "Person" })).rejects.toMatchObject({
      response: { status: 401 },
    });
  });

  it("rejects user without canManageContacts", async () => {
    await expect(
      axios.post(siteUrl, { firstName: "Test", lastName: "Person" }, { auth: nopermCreds }),
    ).rejects.toMatchObject({ response: { status: 401 } });
  });

  let createdContactId: number;

  it("creates a new contact", async () => {
    const res = await axios.post(
      siteUrl,
      { firstName: "New", lastName: "Contact", startDate: "2024-01-01" },
      { auth: managerCreds },
    );
    expect(res.status).toBe(201);
    expect(res.data).toMatchObject({
      person: { firstName: "New", lastName: "Contact" },
      startDate: "2024-01-01",
      endDate: null,
    });
    createdContactId = res.data.id;
  });

  it("allows adding the same person again with different dates", async () => {
    const person = await personRepo.findOneByOrFail({ firstName: "New", lastName: "Contact" });
    const res = await axios.post(siteUrl, { personId: person.id, startDate: "2025-01-01" }, { auth: managerCreds });
    expect(res.status).toBe(201);
    expect(res.data).toMatchObject({
      person: { firstName: "New", lastName: "Contact" },
      startDate: "2025-01-01",
      endDate: null,
    });
    await contactRepo.delete({ id: res.data.id });
  });

  it("reuses existing person when firstName, lastName and email match (no orcid)", async () => {
    const res1 = await axios.post(
      siteUrl,
      { firstName: "Dedup", lastName: "Test", email: "dedup@example.com", startDate: "2024-01-01" },
      { auth: managerCreds },
    );
    expect(res1.status).toBe(201);
    const personId1 = res1.data.person.id;

    const res2 = await axios.post(
      siteUrl,
      { firstName: "Dedup", lastName: "Test", email: "dedup@example.com", startDate: "2025-01-01" },
      { auth: managerCreds },
    );
    expect(res2.status).toBe(201);
    expect(res2.data.person.id).toBe(personId1);

    await contactRepo.delete({ id: res1.data.id });
    await contactRepo.delete({ id: res2.data.id });
    await personRepo.delete({ id: personId1 });
  });

  it("creates separate persons when names match but emails differ", async () => {
    const res1 = await axios.post(
      siteUrl,
      { firstName: "Same", lastName: "Name", email: "email1@example.com" },
      { auth: managerCreds },
    );
    const res2 = await axios.post(
      siteUrl,
      { firstName: "Same", lastName: "Name", email: "email2@example.com" },
      { auth: managerCreds },
    );
    const persons = await personRepo.findBy({ firstName: "Same", lastName: "Name" });
    expect(persons).toHaveLength(2);

    await contactRepo.delete({ id: res1.data.id });
    await contactRepo.delete({ id: res2.data.id });
    for (const p of persons) await personRepo.delete({ id: p.id! });
  });

  it("sets email on existing person matched by orcid when email was null", async () => {
    const person = personRepo.create({ firstName: "Orcid", lastName: "NoEmail", orcid: "0000-0000-0000-9999" });
    const saved = await personRepo.save(person);

    const res = await axios.post(
      siteUrl,
      { firstName: "Orcid", lastName: "NoEmail", orcid: "0000-0000-0000-9999", email: "new@example.com" },
      { auth: managerCreds },
    );
    expect(res.status).toBe(201);

    const updated = await personRepo
      .createQueryBuilder("person")
      .addSelect("person.email")
      .where("person.id = :id", { id: saved.id })
      .getOne();
    expect(updated!.email).toBe("new@example.com");

    await contactRepo.delete({ id: res.data.id });
    await personRepo.delete({ id: saved.id! });
  });

  it("accepts null email in payload", async () => {
    const res = await axios.post(
      siteUrl,
      { firstName: "NullEmail", lastName: "Test", email: null },
      { auth: managerCreds },
    );
    expect(res.status).toBe(201);
    expect(res.data.person.email).toBeNull();

    await contactRepo.delete({ id: res.data.id });
    await personRepo.delete({ firstName: "NullEmail", lastName: "Test" });
  });

  it("accepts null email when using personId", async () => {
    const person = personRepo.create({ firstName: "NullEmail2", lastName: "Test" });
    const saved = await personRepo.save(person);

    const res = await axios.post(siteUrl, { personId: saved.id, email: null }, { auth: managerCreds });
    expect(res.status).toBe(201);

    await contactRepo.delete({ id: res.data.id });
    await personRepo.delete({ id: saved.id! });
  });

  it("rejects invalid date range", async () => {
    await expect(
      axios.post(
        siteUrl,
        { firstName: "Date", lastName: "Test", startDate: "2024-06-01", endDate: "2024-01-01" },
        { auth: managerCreds },
      ),
    ).rejects.toMatchObject({ response: { status: 400 } });
  });

  afterAll(async () => {
    if (createdContactId) {
      await contactRepo.delete({ id: createdContactId });
      await personRepo.delete({ firstName: "New", lastName: "Contact" });
    }
    await personRepo.delete({ firstName: "Date", lastName: "Test" });
  });
});

describe("PUT /api/sites/:siteId/contacts/:contactId", () => {
  let contactId: number;
  let personId: number;

  beforeAll(async () => {
    const person = personRepo.create({ firstName: "Edit", lastName: "Test" });
    const saved = await personRepo.save(person);
    personId = saved.id!;
    const contact = contactRepo.create({ siteId: "bucharest", personId, startDate: null, endDate: null });
    const savedContact = await contactRepo.save(contact);
    contactId = savedContact.id;
  });

  it("updates dates on a contact", async () => {
    const res = await axios.put(
      `${siteUrl}/${contactId}`,
      { startDate: "2024-01-01", endDate: "2024-12-31" },
      { auth: managerCreds },
    );
    expect(res.status).toBe(200);
    expect(res.data).toMatchObject({
      startDate: "2024-01-01",
      endDate: "2024-12-31",
    });
  });

  it("accepts null email in payload", async () => {
    const res = await axios.put(`${siteUrl}/${contactId}`, { email: null }, { auth: managerCreds });
    expect(res.status).toBe(200);
    expect(res.data.person.email).toBeNull();
  });

  it("adds orcid to name-only person with null email", async () => {
    const res = await axios.put(
      `${siteUrl}/${contactId}`,
      { orcid: "0000-0000-0000-7777", email: null },
      { auth: managerCreds },
    );
    expect(res.status).toBe(200);
    expect(res.data.person.orcid).toBe("0000-0000-0000-7777");
  });

  it("returns 404 for contact belonging to another site", async () => {
    const url = `${backendPublicUrl}sites/mace-head/contacts/${contactId}`;
    await expect(axios.put(url, { startDate: "2024-01-01" }, { auth: managerCreds })).rejects.toMatchObject(
      genResponse(404, { status: 404, errors: ["Contact not found"] }),
    );
  });

  afterAll(async () => {
    await contactRepo.delete({ id: contactId });
    await personRepo.delete({ id: personId });
  });
});

describe("DELETE /api/sites/:siteId/contacts/:contactId", () => {
  let contactId: number;
  let personId: number;

  beforeAll(async () => {
    const person = personRepo.create({ firstName: "Delete", lastName: "Test" });
    const saved = await personRepo.save(person);
    personId = saved.id!;
    const contact = contactRepo.create({ siteId: "bucharest", personId, startDate: null, endDate: null });
    const savedContact = await contactRepo.save(contact);
    contactId = savedContact.id;
  });

  it("deletes a contact", async () => {
    const res = await axios.delete(`${siteUrl}/${contactId}`, { auth: managerCreds });
    expect(res.status).toBe(204);
  });

  it("returns 404 for non-existent contact", async () => {
    await expect(axios.delete(`${siteUrl}/99999`, { auth: managerCreds })).rejects.toMatchObject(
      genResponse(404, { status: 404, errors: ["Contact not found"] }),
    );
  });

  afterAll(async () => {
    await personRepo.delete({ id: personId });
  });
});

describe("GET /api/instrument-pids/:uuid/contacts", () => {
  it("returns fixture contacts", async () => {
    const res = await axios.get(instrumentUrl);
    expect(res.status).toBe(200);
    expect(res.data).toHaveLength(1);
    expect(res.data[0]).toMatchObject({
      person: { firstName: "Jean-Luc", lastName: "Picard" },
    });
  });

  it("hides email from unauthenticated users", async () => {
    const person = personRepo.create({ firstName: "InstrEmail", lastName: "Test", email: "instr@example.com" });
    const saved = await personRepo.save(person);
    const contact = instrumentContactRepo.create({
      instrumentInfoUuid: instrumentUuid,
      personId: saved.id!,
      startDate: null,
      endDate: null,
    });
    const savedContact = await instrumentContactRepo.save(contact);

    const res = await axios.get(instrumentUrl);
    const found = res.data.find((c: any) => c.id === savedContact.id);
    expect(found.person).not.toHaveProperty("email");

    await instrumentContactRepo.delete({ id: savedContact.id });
    await personRepo.delete({ id: saved.id! });
  });

  it("shows email to users with canManageContacts", async () => {
    const person = personRepo.create({ firstName: "InstrEmail2", lastName: "Test", email: "instr2@example.com" });
    const saved = await personRepo.save(person);
    const contact = instrumentContactRepo.create({
      instrumentInfoUuid: instrumentUuid,
      personId: saved.id!,
      startDate: null,
      endDate: null,
    });
    const savedContact = await instrumentContactRepo.save(contact);

    const res = await axios.get(instrumentUrl, { auth: managerCreds });
    const found = res.data.find((c: any) => c.id === savedContact.id);
    expect(found.person.email).toBe("instr2@example.com");

    await instrumentContactRepo.delete({ id: savedContact.id });
    await personRepo.delete({ id: saved.id! });
  });
});

describe("POST /api/instrument-pids/:uuid/contacts", () => {
  it("rejects user without canManageContacts", async () => {
    await expect(
      axios.post(instrumentUrl, { firstName: "Test", lastName: "Person" }, { auth: nopermCreds }),
    ).rejects.toMatchObject({ response: { status: 401 } });
  });

  let createdContactId: number;

  it("creates a new instrument contact", async () => {
    const res = await axios.post(
      instrumentUrl,
      { firstName: "Instrument", lastName: "Contact", startDate: "2024-03-01", endDate: "2024-09-01" },
      { auth: managerCreds },
    );
    expect(res.status).toBe(201);
    expect(res.data).toMatchObject({
      person: { firstName: "Instrument", lastName: "Contact" },
      startDate: "2024-03-01",
      endDate: "2024-09-01",
    });
    createdContactId = res.data.id;
  });

  it("allows adding the same person again with different dates", async () => {
    const person = await personRepo.findOneByOrFail({ firstName: "Instrument", lastName: "Contact" });
    const res = await axios.post(
      instrumentUrl,
      { personId: person.id, startDate: "2025-01-01" },
      { auth: managerCreds },
    );
    expect(res.status).toBe(201);
    expect(res.data).toMatchObject({
      person: { firstName: "Instrument", lastName: "Contact" },
      startDate: "2025-01-01",
      endDate: null,
    });
    await instrumentContactRepo.delete({ id: res.data.id });
  });

  afterAll(async () => {
    if (createdContactId) {
      await instrumentContactRepo.delete({ id: createdContactId });
      await personRepo.delete({ firstName: "Instrument", lastName: "Contact" });
    }
  });
});

describe("PUT /api/instrument-pids/:uuid/contacts/:contactId", () => {
  let contactId: number;
  let personId: number;

  beforeAll(async () => {
    const person = personRepo.create({ firstName: "InstrEdit", lastName: "Test" });
    const saved = await personRepo.save(person);
    personId = saved.id!;
    const contact = instrumentContactRepo.create({
      instrumentInfoUuid: instrumentUuid,
      personId,
      startDate: null,
      endDate: null,
    });
    const savedContact = await instrumentContactRepo.save(contact);
    contactId = savedContact.id;
  });

  it("updates dates on an instrument contact", async () => {
    const res = await axios.put(
      `${instrumentUrl}/${contactId}`,
      { startDate: "2024-02-01", endDate: "2024-11-30" },
      { auth: managerCreds },
    );
    expect(res.status).toBe(200);
    expect(res.data).toMatchObject({
      startDate: "2024-02-01",
      endDate: "2024-11-30",
    });
  });

  afterAll(async () => {
    await instrumentContactRepo.delete({ id: contactId });
    await personRepo.delete({ id: personId });
  });
});

describe("DELETE /api/instrument-pids/:uuid/contacts/:contactId", () => {
  let contactId: number;
  let personId: number;

  beforeAll(async () => {
    const person = personRepo.create({ firstName: "InstrDelete", lastName: "Test" });
    const saved = await personRepo.save(person);
    personId = saved.id!;
    const contact = instrumentContactRepo.create({
      instrumentInfoUuid: instrumentUuid,
      personId,
      startDate: null,
      endDate: null,
    });
    const savedContact = await instrumentContactRepo.save(contact);
    contactId = savedContact.id;
  });

  it("deletes an instrument contact", async () => {
    const res = await axios.delete(`${instrumentUrl}/${contactId}`, { auth: managerCreds });
    expect(res.status).toBe(204);
  });

  afterAll(async () => {
    await personRepo.delete({ id: personId });
  });
});
