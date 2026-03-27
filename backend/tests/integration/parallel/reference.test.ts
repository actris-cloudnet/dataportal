import { backendPublicUrl } from "../../lib";
import axios from "axios";
import { describe, expect, it } from "@jest/globals";
import { html2txt } from "../../../src/routes/reference";

const url = `${backendPublicUrl}`;
const uuids = [
  // Regular files
  "2bb32746-faf0-4057-9076-ed2e698dcf36", // 2019-07-16 classification from bucharest with source files
  "1bb32746-faf0-4057-9076-ed2e698dcf36", // 2019-07-16 categorize from bucharest with source files
  "b6de8cf4-8825-47b0-aaa9-4fd413bbb0d7", // 2019-07-16 lidar from bucharest
  "f036da43-c19c-4832-99f9-6cc88f3255c5", // 2019-07-16 radar from bucharest
  "acf78456-11b1-41a6-b2de-aa7590a75675", // 2021-02-20 radar from bucharest
  "d21d6a9b-6804-4465-a026-74ec429fe17d", // 2019-09-01 radar from hyytiala
  "8f0d21bb-7238-450a-af9c-f333d13f0bd1", // 2020-09-01 radar from hyytiala
  "c8f32746-faf0-4057-9076-ed2e698dcc34", // 2021-01-26 mwr-l1c from bucharest with lidar source
  // Model files
  "a45a2e9a-e39d-4af2-9798-5ea0fadf041e", // 2019-07-16 model from bucharest
  // Legacy files
  "0afca83a-7b6b-4288-82f6-a59685346617", // 2009-07-16 legacy classification from new-york
  // Collections of regular and model files
  "48092c00-161d-4ca2-a29d-628cf8e960f6", // collection with regular and model files
  "7a6c6675-af65-4650-a20c-e061344393d1", // collection with regular files
  // Collection of legacy files
  "6e145ec8-7d66-4a5b-9c5e-c1fdfadafc6b", // legacy collection
];

describe("GET /api/reference", () => {
  const examples = [
    {
      input: "This is a link.",
      expected: "This is a link.",
    },
    {
      input: "This is a link to <a href='https://example.com'>a website.</a>",
      expected: "This is a link to a website.",
    },
    {
      input: "This is a link to <a href='https://example.com'>https://example.com</a>.",
      expected: "This is a link to https://example.com.",
    },
  ];

  for (const example of examples) {
    it("converts HTML to text", () => {
      expect(html2txt(example.input)).toBe(example.expected);
    });
  }
});

describe("GET /api/reference", () => {
  for (const uuid of uuids) {
    describe(`/${uuid}`, () => {
      for (const format of ["html", "bibtex", "ris", "txt"]) {
        it(`outputs citation as ${format}`, async () => {
          const res = await axios.get(`${url}reference/${uuid}/citation`, {
            params: { format: format },
          });
          expect(res.data).toMatchSnapshot();
        });
      }

      for (const format of ["html", "txt"]) {
        it(`outputs acknowledgements as ${format}`, async () => {
          const res = await axios.get(`${url}reference/${uuid}/acknowledgements`, {
            params: { format: format },
          });
          expect(res.data).toMatchSnapshot();
        });
      }

      for (const format of ["html", "txt"]) {
        it(`outputs data availability`, async () => {
          const res = await axios.get(`${url}reference/${uuid}/data-availability`, {
            params: { format: format },
          });
          expect(res.data).toMatchSnapshot();
        });
      }
    });
  }
});
