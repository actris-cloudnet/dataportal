import { backendPublicUrl } from "../../lib";
import axios from "axios";
import { describe, expect, it } from "@jest/globals";

const url = `${backendPublicUrl}`;
const uuids = [
  // Regular files
  "2bb32746-faf0-4057-9076-ed2e698dcf36",
  "1bb32746-faf0-4057-9076-ed2e698dcf36",
  "b6de8cf4-8825-47b0-aaa9-4fd413bbb0d7",
  "f036da43-c19c-4832-99f9-6cc88f3255c5",
  // Model files
  "a45a2e9a-e39d-4af2-9798-5ea0fadf041e",
  // Collections
  "48092c00-161d-4ca2-a29d-628cf8e960f6",
  "7a6c6675-af65-4650-a20c-e061344393d1",
];

describe("GET /api/reference", () => {
  for (const uuid of uuids) {
    describe(`/${uuid}`, () => {
      for (const format of ["html", "bibtex", "ris"]) {
        it(`outputs citation as ${format}`, async () => {
          const res = await axios.get(`${url}reference/${uuid}`, { params: { citation: "true", format } });
          expect(res.data).toMatchSnapshot();
        });
      }

      it(`outputs acknowledgements`, async () => {
        const res = await axios.get(`${url}reference/${uuid}`, {
          params: { acknowledgements: "true", format: "html" },
        });
        expect(res.data).toMatchSnapshot();
      });

      it(`outputs data availability`, async () => {
        const res = await axios.get(`${url}reference/${uuid}`, {
          params: { dataAvailability: "true", format: "html" },
        });
        expect(res.data).toMatchSnapshot();
      });
    });
  }
});
