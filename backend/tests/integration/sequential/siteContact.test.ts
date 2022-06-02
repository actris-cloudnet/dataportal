import axios from "axios";
import { readFileSync } from "fs";

import { backendPrivateUrl } from "../../lib";

const SITE_CONTACTS_URL = `${backendPrivateUrl}site-contacts`;
const PERSONS_URL = `${backendPrivateUrl}persons`;

interface ContactData {
  siteContactId: number;
}

beforeAll(async () => {
  // Remove site contacts
  let req = await axios.get(SITE_CONTACTS_URL);
  const data: ContactData[] = req.data;
  for (const contact of data) {
    await axios.delete(`${SITE_CONTACTS_URL}/${contact.siteContactId}`);
  }
  // Remove persons
  await axios.delete(PERSONS_URL);
});

describe("test /site-contacts and /persons private api", () => {
  it("responds with zero site contacts in the beginning", async () => {
    const res = await axios.get(SITE_CONTACTS_URL);
    expect(res.data).toHaveLength(0);
  });

  it("adds person A to site M with role E", async () => {
    const rawData = readFileSync("tests/data/siteContact-post-AEM.json", "utf8");
    const data = JSON.parse(rawData);
    await expect(axios.post(SITE_CONTACTS_URL, data)).resolves.toMatchObject({ status: 200 });
  });

  it("adds person B to site H with role S", async () => {
    const rawData = readFileSync("tests/data/siteContact-post-BSH.json", "utf8");
    const data = JSON.parse(rawData);
    await expect(axios.post(SITE_CONTACTS_URL, data)).resolves.toMatchObject({ status: 200 });
  });

  it("responds with two site contacts and two persons", async () => {
    const resSiteContacs = await axios.get(SITE_CONTACTS_URL);
    const resPersons = await axios.get(PERSONS_URL);
    expect(resSiteContacs.data).toHaveLength(2);
    expect(resPersons.data).toHaveLength(2);
  });

  it("deletes all (zero) persons without site contact roles ", async () => {
    const resDelete = await axios.delete(PERSONS_URL);
    expect(resDelete.status).toBe(200);
    const resSiteContacs = await axios.get(SITE_CONTACTS_URL);
    const resPersons = await axios.get(PERSONS_URL);
    expect(resSiteContacs.data).toHaveLength(2);
    expect(resPersons.data).toHaveLength(2);
  });

  it("adds orcid to persons B and changes his role and email", async () => {
    const res = await axios.get(SITE_CONTACTS_URL);
    let personId: Number | undefined = undefined;
    let siteContactId: Number | undefined = undefined;
    res.data.forEach((result: any) => {
      if (result.firstname === "Bob") {
        siteContactId = result.siteContactId;
        personId = result.personId;
      }
    });
    expect(personId).not.toBe(undefined);
    expect(siteContactId).not.toBe(undefined);
    // Update Site contact
    const siteContactPutRawData = readFileSync("tests/data/siteContact-put.json", "utf8");
    const resPutSiteContact = await axios.put(
      `${SITE_CONTACTS_URL}/${siteContactId}`,
      JSON.parse(siteContactPutRawData)
    );
    expect(resPutSiteContact.status).toBe(200);
    // Update person
    const personPutRawData = readFileSync("tests/data/person-put.json", "utf8");
    const resPutPerson = await axios.put(`${PERSONS_URL}/${personId}`, JSON.parse(personPutRawData));
    expect(resPutPerson.status).toBe(200);

    // Check updated values
    let newRole: string | undefined = undefined;
    let newEmail: string | undefined = undefined;
    let newOrcid: string | undefined = undefined;
    const updatedRes = await axios.get(SITE_CONTACTS_URL);
    updatedRes.data.forEach((result: any) => {
      if (result.siteContactId === siteContactId) {
        newRole = result.role;
        newEmail = result.email;
        newOrcid = result.orcid;
      }
    });
    expect(newRole).toBe("technician");
    expect(newEmail).toBe("B@G.EE");
    expect(newOrcid).toBe("9999-9999-9999-9999");
  });

  it("changes the site of A", async () => {
    const res = await axios.get(SITE_CONTACTS_URL);
    let siteContactId: Number | undefined;
    res.data.forEach((result: any) => {
      if (result.firstname === "Alice") {
        siteContactId = result.siteContactId;
      }
    });
    expect(siteContactId).not.toBe(undefined);
    const putRes = await axios.put(
      `${SITE_CONTACTS_URL}/${siteContactId}`,
      JSON.parse(readFileSync("tests/data/siteContact-put-site.json", "utf8"))
    );
    expect(putRes.status).toBe(200);
    const resMaceHead = await axios.get(`${SITE_CONTACTS_URL}?siteId=mace-head`);
    expect(resMaceHead.data).toHaveLength(0);
    const resHyytiala = await axios.get(`${SITE_CONTACTS_URL}?siteId=hyytiala`);
    expect(resHyytiala.data).toHaveLength(2);
  });
});
