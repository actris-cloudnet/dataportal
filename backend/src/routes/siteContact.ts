import { Connection, Repository } from "typeorm";
import { Request, RequestHandler, Response } from "express";
import { SiteContact, RoleType } from "../entity/SiteContact";
import { Person } from "../entity/Person";
import { Site } from "../entity/Site";

interface SiteContactApiData {
  siteId?: string;
  siteContactId?: number;
  role?: string;
  email?: string;
  personId?: number;
  firstname?: string;
  surname?: string;
  orcid?: string;
}

export class SiteContactRoutes {
  private siteContactRepository: Repository<SiteContact>;
  private personRepository: Repository<Person>;
  private siteRepository: Repository<Site>;

  constructor(conn: Connection) {
    this.personRepository = conn.getRepository<Person>("person");
    this.siteContactRepository = conn.getRepository<SiteContact>("site_contact");
    this.siteRepository = conn.getRepository<Site>("site");
  }

  // POST: Create a new site contact
  postSiteContact: RequestHandler = async (req: Request, res: Response, next) => {
    const postData: SiteContactApiData = req.body;
    const mandatory_keys = new Set<string>(["firstname", "surname", "role", "email", "siteId"]);
    const datakeys = new Set<string>();
    Object.keys(postData).forEach((key) => datakeys.add(key));
    const intersection = new Set<string>(Array.from(datakeys).filter((key) => mandatory_keys.has(key)));
    if (intersection.size != mandatory_keys.size) {
      return next({ status: 400, error: "missing fields" });
    }
    const role: RoleType | undefined = this.roleFromString(postData.role!);
    if (role === undefined) {
      return next({ status: 400, error: "unexpected role" });
    }
    let existingSite: Site | undefined = await this.postExistingSite(postData);
    let site: Site;
    if (existingSite === undefined) {
      return next({ status: 400, error: "site does not exist" });
    } else {
      site = existingSite;
    }
    let existingPerson: Person | undefined = await this.postExistingPerson(postData);
    let existingSiteContact: SiteContact | undefined;
    if (existingPerson !== undefined) {
      let person: Person = existingPerson;
      existingSiteContact = await this.postExistingSiteContact(site, person, role);
      if (existingSiteContact !== undefined) {
        return next({
          status: 400,
          error: "person already has this role for the site",
        });
      } else {
        const siteContact: SiteContact = {
          site: site,
          person: person,
          email: postData.email!,
          role: role!,
        };
        try {
          await this.siteContactRepository.save(siteContact);
        } catch (err) {
          return next({ status: 400, error: err });
        }
        res.sendStatus(200);
        return;
      }
    } else {
      // Create a new person and a new site contact role
      const person: Person = {
        firstname: postData.firstname!,
        surname: postData.surname!,
        orcid: postData.orcid,
      };
      const siteContact: SiteContact = {
        site: site,
        person: person,
        email: postData.email!,
        role: role!,
      };

      try {
        await this.personRepository.save(person);
      } catch (err) {
        return next({ status: 400, error: err });
      }
      try {
        await this.siteContactRepository.save(siteContact);
      } catch (err) {
        return next({ status: 400, error: err });
      }
      res.sendStatus(200);
      return;
    }
  };

  private async postExistingPerson(postData: SiteContactApiData): Promise<Person | undefined> {
    return this.personRepository
      .createQueryBuilder("person")
      .where("person.firstname = :firstname", { firstname: postData.firstname })
      .andWhere("person.surname = :surname", { surname: postData.surname })
      .andWhere("person.orcid = :orcid", { orcid: postData.orcid })
      .getOne();
  }
  private async postExistingSite(postData: SiteContactApiData): Promise<Site | undefined> {
    return this.siteRepository
      .createQueryBuilder("site")
      .where("site.id = :siteId", { siteId: postData.siteId })
      .getOne();
  }
  private async postExistingSiteContact(site: Site, person: Person, role: RoleType): Promise<SiteContact | undefined> {
    return this.siteContactRepository
      .createQueryBuilder("site_contact")
      .where("site_contact.siteId = :siteId", { siteId: site.id })
      .andWhere("site_contact.personId = :personId", { personId: person.id })
      .andWhere("site_contact.role = :role", { role: role })
      .getOne();
  }

  // GET get list site contacts
  getSiteContacts: RequestHandler = async (req: Request, res: Response) => {
    const query: SiteContactApiData = req.query;
    let results;
    if (query.siteId !== undefined) {
      results = await this.siteContactRepository
        .createQueryBuilder("site_contact")
        .leftJoinAndSelect("site_contact.person", "person")
        .leftJoinAndSelect("site_contact.site", "site")
        .where("site_contact.siteId = :siteId", { siteId: query.siteId })
        .getMany();
    } else {
      results = await this.siteContactRepository
        .createQueryBuilder("site_contact")
        .leftJoinAndSelect("site_contact.person", "person")
        .leftJoinAndSelect("site_contact.site", "site")
        .getMany();
    }

    const getResults: SiteContactApiData[] = results.map((r) => ({
      siteId: r.site.id,
      siteContactId: r.id,
      role: r.role,
      email: r.email,
      personId: r.person.id,
      firstname: r.person.firstname,
      surname: r.person.surname,
      orcid: r.person.orcid,
    }));

    res.json(getResults);
    return;
  };

  // Update
  putSiteContact: RequestHandler = async (req: Request, res: Response, next) => {
    const siteContactId: number = Number(req.params.id);
    const requestedSiteContact: SiteContact | undefined = await this.siteContactRepository
      .createQueryBuilder("site_contact")
      .leftJoinAndSelect("site_contact.site", "site")
      .where("site_contact.id = :id", { id: siteContactId })
      .getOne();
    let siteContact: SiteContact;
    if (requestedSiteContact === undefined) {
      return next({
        status: 400,
        error: "requested site contact does not exist",
      });
    }
    siteContact = requestedSiteContact;

    const data: SiteContactApiData = req.body;
    // Check that PUT request tries to update only site, role or email field
    const accepted_keys = new Set<string>(["siteId", "role", "email"]);
    let datakeys = new Set<string>();
    Object.keys(data).forEach((k) => datakeys.add(k));
    let keydiff = new Set<string>(Array.from(datakeys).filter((k) => !accepted_keys.has(k)));
    if (keydiff.size > 0) {
      return next({
        status: 400,
        error: "you can only change siteId, role or email from this endpoint",
      });
    }
    // Update site
    if (datakeys.has("siteId")) {
      const updatedSite: Site | undefined = await this.siteRepository
        .createQueryBuilder("site")
        .where("site.id = :id", { id: data.siteId })
        .getOne();
      if (updatedSite === undefined) {
        return next({ status: 400, error: "site does not exist" });
      }
      siteContact.site = updatedSite!;
    }
    // Update role
    if (datakeys.has("role")) {
      let role: RoleType | undefined = this.roleFromString(data.role!);
      if (role === undefined) {
        return next({
          status: 400,
          error: "unexpected role",
        });
      }
      siteContact.role = role!;
    }
    // Update email
    if (datakeys.has("email")) {
      siteContact.email = data.email!;
    }
    // Save changes
    try {
      await this.siteContactRepository.save(siteContact);
    } catch (err) {
      return next({ status: 400, error: err });
    }

    res.sendStatus(200);
    return;
  };

  // DELETE remove site contact by id
  deleteSiteContact: RequestHandler = async (req: Request, res: Response, next) => {
    const siteContactId = req.params.id;
    try {
      await this.siteContactRepository
        .createQueryBuilder()
        .delete()
        .from(SiteContact)
        .where("id = :id", { id: siteContactId })
        .execute();
    } catch (err) {
      return next({ status: 400, error: err });
    }
    res.sendStatus(200);
    return;
  };

  getPersons: RequestHandler = async (req: Request, res: Response) => {
    const persons: Person[] = await this.personRepository.createQueryBuilder("person").getMany();

    const responseResults: SiteContactApiData[] = persons.map((p) => ({
      personId: p.id,
      firstname: p.firstname,
      surname: p.surname,
      orcid: p.orcid,
    }));

    res.json(responseResults);
    return;
  };

  // PUT Update person by id
  putPerson: RequestHandler = async (req: Request, res: Response, next) => {
    const personId: number = Number(req.params.id);
    const requestedPerson: Person | undefined = await this.personRepository
      .createQueryBuilder("person")
      .where("person.id = :id", { id: personId })
      .getOne();
    let person: Person;
    if (requestedPerson === undefined) {
      return next({ status: 400, error: "requested person does not exist" });
    }
    person = requestedPerson;

    const data: SiteContactApiData = req.body;

    person.firstname = data.firstname;
    person.surname = data.surname;
    person.orcid = data.orcid;

    try {
      await this.personRepository.save(person);
    } catch (err) {
      return next({ status: 400, error: err });
    }
    res.sendStatus(200);
    return;
  };

  deletePerson: RequestHandler = async (req: Request, res: Response, next) => {
    const personId: number = Number(req.params.id);
    const requestedPersonRaw: any | undefined = await this.personRepository
      .createQueryBuilder("person")
      .leftJoinAndSelect(SiteContact, "site_contact", "site_contact.personId = person.id")
      .where("person.id = :id", { id: personId })
      .getRawOne();
    if (requestedPersonRaw === undefined) {
      return next({ status: 400, error: "requested person does not exist" });
    }
    if (requestedPersonRaw.site_contact_id !== null) {
      return next({
        status: 400,
        error: "requested person cannot be deleted, since at least one site contact role exists",
      });
    } else {
      await this.personRepository.delete(personId);
    }
    return res.sendStatus(200);
  };

  // DELETE Delete persons that are not associated with any site contact
  deletePersons: RequestHandler = async (req: Request, res: Response) => {
    let orphans: Person[] = await this.personRepository
      .createQueryBuilder("person")
      .leftJoinAndSelect(SiteContact, "site_contact", "site_contact.personId = person.id")
      .where("site_contact.personId is null")
      .getMany();

    await this.personRepository.remove(orphans);
    res.sendStatus(200);
    return;
  };

  private roleFromString(role_str: string): RoleType | undefined {
    return (<any>RoleType)[role_str.toUpperCase()];
  }
}
