import { Connection, Repository } from 'typeorm'
import { Request, RequestHandler, Response } from 'express'
import { SiteContact, RoleType } from '../entity/SiteContact'
import { Person } from '../entity/Person'
import { Site } from '../entity/Site'

interface SiteContactApiData {
  siteid?: string;
  sitecontactid?: number;
  role?: string;
  email?: string;
  personid?: number;
  firstname?: string;
  surname?: string;
  orcid?: string;
}

export class SiteContactRoutes {
  private siteContactRepository: Repository<SiteContact>;
  private personRepository: Repository<Person>;
  private siteRepository: Repository<Site>;

  constructor(conn: Connection) {
    this.personRepository = conn.getRepository<Person>('person')
    this.siteContactRepository =
      conn.getRepository<SiteContact>('site_contact')
    this.siteRepository = conn.getRepository<Site>('site')
  }
  // POST: Create a new site contact
  postSiteContact: RequestHandler = async (
    req: Request,
    res: Response,
    next
  ) => {
    const postData: SiteContactApiData = req.body
    const mandatory_keys = new Set<string>([
      'firstname',
      'surname',
      'role',
      'email',
      'siteid',
    ])
    const datakeys = new Set<string>()
    Object.keys(postData).forEach((key) => datakeys.add(key))
    const intersection = new Set<string>(
      Array.from(datakeys).filter((key) => mandatory_keys.has(key))
    )
    if (intersection.size != mandatory_keys.size) {
      return next({ status: 404, error: 'missing fields' })
    }
    const role: RoleType | undefined = this.roleFromString(postData.role!)
    if (role === undefined) {
      return next({ status: 404, error: 'unexpected role' })
    }
    let existing_site: Site | undefined = await this.postExistingSite(postData)
    let site: Site
    if (existing_site === undefined) {
      return next({ status: 404, error: 'site does not exist' })
    } else {
      site = existing_site
    }
    let existing_person: Person | undefined = await this.postExistingPerson(
      postData
    )
    let existing_siteContact: SiteContact | undefined
    if (existing_person !== undefined) {
      let person: Person = existing_person
      existing_siteContact = await this.postExistingSiteContact(
        site,
        person,
        role
      )
      if (existing_siteContact !== undefined) {
        return next({
          status: 404,
          error: 'person already has this role for the site',
        })
      } else {
        let siteContact: SiteContact = {
          site: site,
          person: person,
          email: postData.email!,
          role: role!,
        }
        try {
          await this.siteContactRepository.save(siteContact)
        } catch (err) {
          return next({ status: 404, error: err })
        }
        res.sendStatus(200)
        return
      }
    } else {
      // Create a new person and a new site contact role
      let person: Person = {
        firstname: postData.firstname!,
        surname: postData.surname!,
        orcid: postData.orcid,
      }
      let siteContact: SiteContact = {
        site: site,
        person: person,
        email: postData.email!,
        role: role!,
      }

      try {
        await this.personRepository.save(person)
      } catch (err) {
        return next({ status: 404, error: err })
      }
      try {
        await this.siteContactRepository.save(siteContact)
      } catch (err) {
        return next({ status: 404, error: err })
      }
      res.sendStatus(200)
      return
    }
    return next({ status: 404, error: 'assert: unexpected' })
  };

  private async postExistingPerson(
    postData: SiteContactApiData
  ): Promise<Person | undefined> {
    let personPromise: Promise<Person | undefined> = this.personRepository
      .createQueryBuilder('person')
      .where('person.firstname = :firstname', { firstname: postData.firstname })
      .andWhere('person.surname = :surname', { surname: postData.surname })
      .andWhere('person.orcid = :orcid', { orcid: postData.orcid })
      .getOne()
    return personPromise
  }
  private async postExistingSite(
    postData: SiteContactApiData
  ): Promise<Site | undefined> {
    let sitePromise: Promise<Site | undefined> = this.siteRepository
      .createQueryBuilder('site')
      .where('site.id = :siteid', { siteid: postData.siteid })
      .getOne()
    return sitePromise
  }
  private async postExistingSiteContact(
    site: Site,
    person: Person,
    role: RoleType
  ): Promise<SiteContact | undefined> {
    let siteContactPromise: Promise<SiteContact | undefined> =
      this.siteContactRepository
        .createQueryBuilder('site_contact')
        .where('site_contact.siteId = :siteid', { siteid: site.id })
        .andWhere('site_contact.personId = :personid', { personid: person.id })
        .andWhere('site_contact.role = :role', { role: role })
        .getOne()
    return siteContactPromise
  }

  // GET get list site contacts
  getSiteContacts: RequestHandler = async (
    req: Request,
    res: Response,
    next // eslint-disable-line @typescript-eslint/no-unused-vars
  ) => {
    const query: SiteContactApiData = req.query
    let results
    if (query.siteid !== undefined) {
      results = await this.siteContactRepository
        .createQueryBuilder('site_contact')
        .leftJoinAndSelect('site_contact.person', 'person')
        .leftJoinAndSelect('site_contact.site', 'site')
        .where('site_contact.siteId = :siteid', { siteid: query.siteid })
        .getMany()
    } else {
      results = await this.siteContactRepository
        .createQueryBuilder('site_contact')
        .leftJoinAndSelect('site_contact.person', 'person')
        .leftJoinAndSelect('site_contact.site', 'site')
        .getMany()
    }

    let getResults: SiteContactApiData[] = []

    results.forEach((r) => {
      getResults.push({
        siteid: r.site.id,
        sitecontactid: r.id,
        role: r.role,
        email: r.email,
        personid: r.person.id,
        firstname: r.person.firstname,
        surname: r.person.surname,
        orcid: r.person.orcid,
      })
    })

    res.json(getResults)
    return
  };

  // Update
  putSiteContact: RequestHandler = async (
    req: Request,
    res: Response,
    next
  ) => {
    const sitecontactid: number = Number(req.params.id)
    const requestedSiteContact: SiteContact | undefined =
      await this.siteContactRepository
        .createQueryBuilder('site_contact')
        .leftJoinAndSelect('site_contact.site', 'site')
        .where('site_contact.id = :id', { id: sitecontactid })
        .getOne()
    let siteContact: SiteContact
    if (requestedSiteContact === undefined) {
      return next({
        status: 404,
        error: 'requested site contact does not exist',
      })
    }
    siteContact = requestedSiteContact

    const data: SiteContactApiData = req.body
    // Check that PUT request tries to update only site, role or email field
    const accepted_keys = new Set<string>(['siteid', 'role', 'email'])
    let datakeys = new Set<string>()
    Object.keys(data).forEach((k) => datakeys.add(k))
    let keydiff = new Set<string>(
      Array.from(datakeys).filter((k) => !accepted_keys.has(k))
    )
    if (keydiff.size > 0) {
      return next({
        status: 404,
        error: 'you can only change siteid, role or email from this endpoint',
      })
    }
    // Update site
    if (datakeys.has('siteid')) {
      const updatedSite: Site | undefined = await this.siteRepository
        .createQueryBuilder('site')
        .where('site.id = :id', { id: data.siteid })
        .getOne()
      if (updatedSite === undefined) {
        return next({ status: 404, error: 'site does not exist' })
      }
      siteContact.site = updatedSite!
    }
    // Update role
    if (datakeys.has('role')) {
      let role: RoleType | undefined = this.roleFromString(data.role!)
      if (role === undefined) {
        return next({
          status: 404,
          error: 'unexpected role',
        })
      }
      siteContact.role = role!
    }
    // Update email
    if (datakeys.has('email')) {
      siteContact.email = data.email!
    }
    // Save changes
    try {
      await this.siteContactRepository.save(siteContact)
    } catch (err) {
      return next({ status: 404, error: err })
    }

    res.sendStatus(200)
    return
  };

  // DELETE remove site contact by id
  deleteSiteContact: RequestHandler = async (
    req: Request,
    res: Response,
    next
  ) => {
    const sitecontactid = req.params.id
    try {
      await this.siteContactRepository
        .createQueryBuilder()
        .delete()
        .from(SiteContact)
        .where('id = :id', { id: sitecontactid })
        .execute()
    } catch (err) {
      return next({ status: 404, error: err })
    }
    res.sendStatus(200)
    return
  };

  getPersons: RequestHandler = async (
    req: Request,
    res: Response,
    next // eslint-disable-line @typescript-eslint/no-unused-vars
  ) => {
    const persons: Person[] = await this.personRepository
      .createQueryBuilder('person')
      .getMany()
    let responseResults: SiteContactApiData[] = []
    persons.forEach((p) => {
      responseResults.push({
        personid: p.id,
        firstname: p.firstname,
        surname: p.surname,
        orcid: p.orcid,
      })
    })

    res.json(responseResults)
    return
  }

  // PUT Update person by id
  putPerson: RequestHandler = async (req: Request, res: Response, next) => {
    const personid: number = Number(req.params.id)
    const requestedPerson: Person | undefined = await this.personRepository
      .createQueryBuilder('person')
      .where('person.id = :id', { id: personid })
      .getOne()
    let person: Person
    if (requestedPerson === undefined) {
      return next({ status: 404, error: 'requested person does not exist' })
    }
    person = requestedPerson

    const data: SiteContactApiData = req.body

    person.firstname = data.firstname
    person.surname = data.surname
    person.orcid = data.orcid

    try {
      await this.personRepository.save(person)
    } catch (err) {
      return next({ status: 404, error: err })
    }
    res.sendStatus(200)
    return
  };
  deletePerson: RequestHandler = async (req: Request, res: Response, next) => {
    const personid: number = Number(req.params.id)
    const requestedPersonRaw: any | undefined = await this.personRepository
      .createQueryBuilder('person')
      .leftJoinAndSelect(
        SiteContact,
        'site_contact',
        'site_contact.personId = person.id'
      )
      .where('person.id = :id', {id: personid})
      .getRawOne()
    if (requestedPersonRaw === undefined){
      return next({status: 404, error: 'requested person does not exist'})
    }
    if (requestedPersonRaw.site_contact_id !== null) {
      return next({status: 404, error: 'requested person cannot be deleted, since at least one site contact role exists'})
    } else {
      await this.personRepository.delete(personid)
    }
    return res.sendStatus(200)

  }
  // DELETE Delete persons that are not associated with any site contact
  deletePersons: RequestHandler = async (req: Request, res: Response,
    next  // eslint-disable-line @typescript-eslint/no-unused-vars
  ) => {
    let orphans: Person[] = await this.personRepository
      .createQueryBuilder('person')
      .leftJoinAndSelect(
        SiteContact,
        'site_contact',
        'site_contact.personId = person.id'
      )
      .where('site_contact.personId is null')
      .getMany()

    this.personRepository.remove(orphans)
    res.sendStatus(200)
    return
  };

  private roleFromString(role_str: string): RoleType | undefined {
    let role: RoleType | undefined = (<any>RoleType)[role_str.toUpperCase()]
    return role
  }
}
