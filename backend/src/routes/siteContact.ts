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
  sites?: Site[];
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

  getPersons: RequestHandler = async (req: Request, res: Response) => {
    const data = await this.personRepository.find();
    return res.send(data);
  };

  getContacts: RequestHandler = async (req: Request, res: Response, next) => {
    try {
      const contacts = (await this.siteRepository.find({ relations: ["persons"] }))
        .filter((ele) => !(ele.type[0].includes("arm") || ele.type[0].includes("hidden")))
        .map((ele) => ({
          site: ele.id,
          contacts: ele.persons,
        }));
      return res.send(contacts);
    } catch (err) {
      return next({ status: 400, error: err });
    }
  };

  getSiteContacts: RequestHandler = async (req: Request, res: Response) => {
    let qb = this.siteContactRepository
      .createQueryBuilder("site_contact")
      .leftJoinAndSelect("site_contact.person", "person")
      .leftJoinAndSelect("site_contact.site", "site");
    if (req.query.siteId !== undefined) {
      qb = qb.where("site_contact.siteId = :siteId", { siteId: req.query.siteId });
    }
    const siteContacts = (await qb.getMany()).map((contact) => ({
      siteId: contact.site.id,
      siteContactId: contact.id,
      role: contact.role,
      email: contact.person.email,
      personId: contact.person.id,
      firstname: contact.person.firstname,
      surname: contact.person.surname,
      orcid: contact.person.orcid,
    }));
    return res.send(siteContacts);
  };

  postSiteContact: RequestHandler = async (req: Request, res: Response, next) => {
    const body = req.body;
    const mandatoryKeys = ["firstname", "surname", "role", "siteId"];
    mandatoryKeys.forEach((key) => {
      if (!Object.keys(body).includes(key)) {
        return next({ status: 400, error: "missing fields" });
      }
    });
    const role = this.validateRole(body.role);
    if (role === undefined) {
      return next({ status: 400, error: "unexpected role" });
    }
    const site = await this.findExistingSite(body);
    if (site === undefined) {
      return next({ status: 400, error: "site does not exist" });
    }
    let person: Person | undefined;
    person = await this.findExistingPerson(body);
    if (person !== undefined) {
      const existingSiteContact = await this.findExistingSiteContact(site, person, role);
      if (existingSiteContact) {
        return next({ status: 400, error: "person already has this role for the site" });
      }
    } else {
      person = {
        firstname: body.firstname,
        surname: body.surname,
        orcid: body.orcid,
        email: body.email,
        sites: body.sites,
      };
      try {
        await this.personRepository.save(person);
      } catch (err) {
        return next({ status: 400, error: err });
      }
    }
    const siteContact = {
      site: site,
      person: person,
      role: role,
    };
    try {
      await this.siteContactRepository.save(siteContact);
    } catch (err) {
      return next({ status: 400, error: err });
    }
    return res.sendStatus(200);
  };

  putSiteContact: RequestHandler = async (req: Request, res: Response, next) => {
    const siteContact = await this.siteContactRepository
      .createQueryBuilder("site_contact")
      .leftJoinAndSelect("site_contact.site", "site")
      .where("site_contact.id = :id", { id: req.params.id })
      .getOne();
    if (siteContact === undefined) {
      return next({ status: 400, error: "requested site contact does not exist" });
    }
    const body = req.body;
    const acceptedKeys = ["siteId", "role"];
    const validKeys = new Set(Object.keys(body).filter((key) => acceptedKeys.includes(key)));
    if (validKeys.size == 0) {
      return next({ status: 400, error: "you can only change siteId or role from this endpoint" });
    }
    if (validKeys.has("siteId")) {
      const updatedSite = await this.findExistingSite(body);
      if (updatedSite === undefined) {
        return next({ status: 400, error: "site does not exist" });
      }
      siteContact.site = updatedSite;
    }
    if (validKeys.has("role")) {
      const role = this.validateRole(body.role);
      if (role === undefined) {
        return next({ status: 400, error: "unexpected role" });
      }
      siteContact.role = role;
    }
    try {
      await this.siteContactRepository.save(siteContact);
    } catch (err) {
      return next({ status: 400, error: err });
    }
    return res.sendStatus(200);
  };

  putPerson: RequestHandler = async (req: Request, res: Response, next) => {
    const body = req.body;
    const person = await this.personRepository
      .createQueryBuilder("person")
      .where("person.id = :id", { id: req.params.id })
      .getOne();
    if (person === undefined) {
      return next({ status: 400, error: "requested person does not exist" });
    }
    try {
      person.firstname = body.firstname;
      person.surname = body.surname;
      person.orcid = body.orcid;
      person.email = body.email;
      await this.personRepository.save(person);
    } catch (err) {
      return next({ status: 400, error: err });
    }
    return res.sendStatus(200);
  };

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
    return res.sendStatus(200);
  };

  deletePerson: RequestHandler = async (req: Request, res: Response, next) => {
    const personId = req.params.id;
    const requestedPersonRaw = await this.personRepository
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
      try {
        await this.personRepository.delete(personId);
      } catch (err) {
        return next({ status: 400, error: err });
      }
    }
    return res.sendStatus(200);
  };

  // DELETE Delete persons that are not associated with any site contact
  deletePersons: RequestHandler = async (req: Request, res: Response, next) => {
    const orphans: Person[] = await this.personRepository
      .createQueryBuilder("person")
      .leftJoinAndSelect(SiteContact, "site_contact", "site_contact.personId = person.id")
      .where("site_contact.personId is null")
      .getMany();
    try {
      await this.personRepository.remove(orphans);
    } catch (err) {
      return next({ status: 400, error: err });
    }
    return res.sendStatus(200);
  };

  private async findExistingPerson(postData: SiteContactApiData): Promise<Person | undefined> {
    return this.personRepository
      .createQueryBuilder("person")
      .where("person.firstname = :firstname", { firstname: postData.firstname })
      .andWhere("person.surname = :surname", { surname: postData.surname })
      .andWhere("person.orcid = :orcid", { orcid: postData.orcid })
      .getOne();
  }

  private async findExistingSite(body: SiteContactApiData): Promise<Site | undefined> {
    return this.siteRepository.createQueryBuilder("site").where("site.id = :siteId", { siteId: body.siteId }).getOne();
  }

  private async findExistingSiteContact(site: Site, person: Person, role: RoleType): Promise<SiteContact | undefined> {
    return this.siteContactRepository
      .createQueryBuilder("site_contact")
      .where("site_contact.siteId = :siteId", { siteId: site.id })
      .andWhere("site_contact.personId = :personId", { personId: person.id })
      .andWhere("site_contact.role = :role", { role: role })
      .getOne();
  }

  private validateRole(role: string): RoleType | undefined {
    return (<any>RoleType)[role.toUpperCase()];
  }
}
