import { backendPublicUrl } from "../../lib";
import axios from "axios";
import { readResources } from "../../../../shared/lib";

const url = `${backendPublicUrl}`;
let resources: any;
let uuids: string[];

beforeAll(async () => {
  resources = await readResources();
  uuids = resources["allfiles"].map((f: any) => f.uuid);
});

describe("GET /api/reference", () => {
  it("tests that reference api responds with some contect and correct type", async () => {
    for (const uuid of uuids) {
      let _url = url.concat("reference/", uuid);
      const bib = (await axios.get(_url, { params: { citation: "true", format: "bibtex" } })).data;
      const ris = (await axios.get(_url, { params: { citation: "true", format: "ris" } })).data;
      const ack = (await axios.get(_url, { params: { acknowledgements: "true", format: "json" } })).data;
      const dat = (await axios.get(_url, { params: { dataAvailibility: "true", format: "html" } })).data;
      expect(typeof bib).toBe("string");
      expect(typeof ris).toBe("string");
      expect(Array.isArray(ack)).toBe(true);
      expect(typeof dat).toBe("string");
      expect(bib.length).toBeGreaterThan(0);
      expect(ris.length).toBeGreaterThan(0);
      expect(ack.length).toBeGreaterThan(0);
      expect(dat.length).toBeGreaterThan(0);
    }
  });
});
