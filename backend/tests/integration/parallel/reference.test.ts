import { backendPublicUrl } from "../../lib";
import axios from "axios";
import { describe, expect, it } from "@jest/globals";
import { html2txt } from "../../../src/routes/reference";

const url = `${backendPublicUrl}`;
const uuids = [
  // Regular files
  "2bb32746-faf0-4057-9076-ed2e698dcf36",
  "1bb32746-faf0-4057-9076-ed2e698dcf36",
  "b6de8cf4-8825-47b0-aaa9-4fd413bbb0d7",
  "f036da43-c19c-4832-99f9-6cc88f3255c5",
  // Model files
  "a45a2e9a-e39d-4af2-9798-5ea0fadf041e",
  // Legacy files
  "0afca83a-7b6b-4288-82f6-a59685346617",
  // Collections of regular and model files
  "48092c00-161d-4ca2-a29d-628cf8e960f6",
  "7a6c6675-af65-4650-a20c-e061344393d1",
  // Collection of legacy files
  "6e145ec8-7d66-4a5b-9c5e-c1fdfadafc6b",
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
