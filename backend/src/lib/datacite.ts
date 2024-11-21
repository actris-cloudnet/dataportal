import { Collection } from "../entity/Collection";
import axios from "axios";
import env from "./env";
import { CitationService } from "./cite";
import { getCollectionLandingPage } from ".";

export class DataCiteService {
  private citationService: CitationService;

  constructor(citationService: CitationService) {
    this.citationService = citationService;
  }

  async createCollectionDoi(collection: Collection): Promise<string> {
    if (collection.pid) {
      throw new Error(`Collection ${collection.uuid} already has a PID: ${collection.pid}`);
    }
    const res = await axios.post(`${env.DATACITE_API_URL}/dois`, await this.collectionDataCite(collection), {
      headers: { "Content-Type": "application/vnd.api+json" },
      auth: { username: env.DATACITE_API_USERNAME, password: env.DATACITE_API_PASSWORD },
      timeout: env.DATACITE_API_TIMEOUT_MS,
    });
    return `${env.DATACITE_DOI_SERVER}/${res.data.data.attributes.doi}`;
  }

  async updateCollectionDoi(collection: Collection) {
    if (!collection.pid || !collection.pid.startsWith(`${env.DATACITE_DOI_SERVER}/${env.DATACITE_DOI_PREFIX}/`)) {
      throw new Error(`Collection ${collection.uuid} doesn't have a valid PID: ${collection.pid}`);
    }
    const doi = collection.pid.slice(env.DATACITE_DOI_SERVER.length + 1);
    await axios.put(`${env.DATACITE_API_URL}/dois/${doi}`, await this.collectionDataCite(collection), {
      headers: { "Content-Type": "application/vnd.api+json" },
      auth: { username: env.DATACITE_API_USERNAME, password: env.DATACITE_API_PASSWORD },
      timeout: env.DATACITE_API_TIMEOUT_MS,
    });
  }

  private async collectionDataCite(collection: Collection): Promise<object> {
    const doiSuffix = collection.uuid.toLowerCase().replace(/-/g, "").slice(0, 16);
    const citation = await this.citationService.getCollectionCitation(collection);
    const creators = citation.authors.map((person) => ({
      name: `${person.lastName}, ${person.firstName}`,
      nameType: "Personal",
      givenName: person.firstName,
      familyName: person.lastName,
      nameIdentifiers: person.orcid
        ? [
            {
              schemeUri: "https://orcid.org",
              nameIdentifier: `https://orcid.org/${person.orcid}`,
              nameIdentifierScheme: "ORCID",
            },
          ]
        : undefined,
    }));
    return {
      data: {
        type: "dois",
        attributes: {
          event: "publish",
          doi: `${env.DATACITE_DOI_PREFIX}/${doiSuffix}`,
          creators,
          titles: [{ lang: "en", title: citation.title }],
          publisher: citation.publisher,
          publicationYear: citation.year,
          types: { resourceTypeGeneral: "Dataset" },
          url: getCollectionLandingPage(collection),
          schemaVersion: "http://datacite.org/schema/kernel-4",
          language: "en",
          dates: [
            { date: citation.createdAt, dateType: "Created" },
            { date: `${citation.startDate}/${citation.endDate}`, dateType: "Collected" },
          ],
          formats: ["application/zip", "application/netcdf"],
          rightsList: [
            {
              lang: "en",
              schemeURI: "https://spdx.org/licenses/",
              rightsIdentifierScheme: "SPDX",
              rightsIdentifier: "CC-BY-4.0",
              rightsURI: "https://creativecommons.org/licenses/by/4.0/",
              rights: "Creative Commons Attribution 4.0 International",
            },
          ],
          geoLocations: citation.locations.map((location) => ({
            geoLocationPlace: location.name,
            geoLocationPoint:
              location.latitude && location.longitude
                ? {
                    pointLatitude: location.latitude,
                    pointLongitude: location.longitude,
                  }
                : undefined,
          })),
        },
      },
    };
  }
}
