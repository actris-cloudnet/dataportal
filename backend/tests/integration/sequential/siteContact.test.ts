import axios from 'axios'
import { readFileSync } from 'fs'

import { backendPrivateUrl } from '../../lib'

const SITE_CONTACTS_URL = `${backendPrivateUrl}site-contacts`
const PERSONS_URL = `${backendPrivateUrl}persons`

interface ContactData {
  sitecontactid: number;
}

beforeAll(async () => {
  // Remove site contacts
  let req = await axios.get(SITE_CONTACTS_URL)
  const data: ContactData[] = req.data
  data.forEach(async (contact) => {
    let id = contact.sitecontactid
    await axios.delete(`${SITE_CONTACTS_URL}/${id}`)
  })
  // Remove persons
  await axios.delete(PERSONS_URL)
})

describe('test /site-contacts and /persons private api', () => {
  it('responds with zero site contacts in the beginning', async () => {
    const res = await axios.get(SITE_CONTACTS_URL)
    expect(res.data).toHaveLength(0)
  })
  it('adds person A to site M with role E', async () => {
    const rawData = readFileSync(
      'tests/data/siteContact-post-AEM.json',
      'utf8'
    )
    const data = JSON.parse(rawData)
    let resp = await axios.post(SITE_CONTACTS_URL, data)
  })
  it('adds person B to site H with role S', async () => {
    const rawData = readFileSync(
      'tests/data/siteContact-post-BSH.json',
      'utf8'
    )
    const data = JSON.parse(rawData)
    let resp = await axios.post(SITE_CONTACTS_URL, data)
  })

  it('responds with two site contacts and two persons', async () => {
    const resSiteContacs = await axios.get(SITE_CONTACTS_URL)
    const resPersons = await axios.get(PERSONS_URL)
    expect(resSiteContacs.data).toHaveLength(2)
    expect(resPersons.data).toHaveLength(2)
  })
  it('deletes all (zero) persons without site contact roles ', async () => {
    const resDelete = await axios.delete(PERSONS_URL)
    expect(resDelete.status).toBe(200)
    const resSiteContacs = await axios.get(SITE_CONTACTS_URL)
    const resPersons = await axios.get(PERSONS_URL)
    expect(resSiteContacs.data).toHaveLength(2)
    expect(resPersons.data).toHaveLength(2)
  })
  it('adds orcid to persons B and changes his role and email', async () => {
    const res = await axios.get(SITE_CONTACTS_URL)
    let personid: Number | undefined = undefined
    let sitecontactid: Number | undefined = undefined
    res.data.forEach((result: any) => {
      if (result.firstname === 'Bob') {
        sitecontactid = result.sitecontactid
        personid = result.personid
      }
    })
    expect(personid).not.toBe(undefined)
    expect(sitecontactid).not.toBe(undefined)
    // Update Site contact
    const siteContactPutRawData = readFileSync(
      'tests/data/siteContact-put.json',
      'utf8'
    )
    const resPutSiteContact = await axios.put(
      `${SITE_CONTACTS_URL}/${sitecontactid}`,
      JSON.parse(siteContactPutRawData)
    )
    expect(resPutSiteContact.status).toBe(200)
    // Update person
    const personPutRawData = readFileSync('tests/data/person-put.json', 'utf8')
    const resPutPerson = await axios.put(
      `${PERSONS_URL}/${personid}`,
      JSON.parse(personPutRawData)
    )
    expect(resPutPerson.status).toBe(200)

    // Check updated values
    let newRole: string | undefined = undefined
    let newEmail: string | undefined = undefined
    let newOrcid: string | undefined = undefined
    const updatedRes = await axios.get(SITE_CONTACTS_URL)
    updatedRes.data.forEach((result: any) => {
      if (result.sitecontactid === sitecontactid) {
        newRole = result.role
        newEmail = result.email
        newOrcid = result.orcid
      }
    })
    expect(newRole).toBe('technician')
    expect(newEmail).toBe('B@G.EE')
    expect(newOrcid).toBe('9999-9999-9999-9999')
  })

  it('changes the site of A', async () => {
    const res = await axios.get(SITE_CONTACTS_URL)
    let sitecontactid: Number | undefined
    res.data.forEach((result: any) => {
      if (result.firstname === 'Alice') {
        sitecontactid = result.sitecontactid
      }
    })
    expect(sitecontactid).not.toBe(undefined)
    const putRes = await axios.put(
      `${SITE_CONTACTS_URL}/${sitecontactid}`,
      JSON.parse(readFileSync('tests/data/siteContact-put-site.json', 'utf8'))
    )
    expect(putRes.status).toBe(200)
    const resMaceHead = await axios.get(
      `${SITE_CONTACTS_URL}?siteid=mace-head`
    )
    expect(resMaceHead.data).toHaveLength(0)
    const resHyytiala = await axios.get(`${SITE_CONTACTS_URL}?siteid=hyytiala`)
    expect(resHyytiala.data).toHaveLength(2)
  })
})
