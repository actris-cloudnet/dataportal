import { backendPublicUrl, genResponse } from "../../lib";
import { RequestError } from "../../../src/entity/RequestError";
import axios from "axios";
import { describe, expect, it } from "@jest/globals";

describe("GET /api/download/collection/:uuid", () => {
  const url = `${backendPublicUrl}download/collection/`;

  it("responds with 404 if collection is not found", async () => {
    const expectedBody: RequestError = {
      status: 404,
      errors: ["No collection matches this UUID."],
    };
    return expect(axios.get(`${url}25506ea8-d357-4c7b-af8c-95dfcc34fc7d`)).rejects.toMatchObject(
      genResponse(expectedBody.status, expectedBody),
    );
  });

  it("responds 404 if invalid uuid", async () => {
    return expect(axios.get(`${url}kisseliini`)).rejects.toMatchObject(
      genResponse(404, { errors: ["Not found: invalid UUID"] }),
    );
  });
});

describe("GET /api/download/product/:uuid/:filename", () => {
  const url = `${backendPublicUrl}download/product/`;

  it("responds with 404 if file is not found", async () => {
    const expectedBody: RequestError = {
      status: 404,
      errors: ["File not found"],
    };
    return expect(axios.get(`${url}25506ea8-d357-4c7b-af8c-95dfcc34fc7d/test.nc`)).rejects.toMatchObject(
      genResponse(expectedBody.status, expectedBody),
    );
  });

  it("responds 404 if invalid uuid", async () => {
    return expect(axios.get(`${url}kisseliini/asd`)).rejects.toMatchObject(
      genResponse(404, { errors: ["Not found: invalid UUID"] }),
    );
  });

  it("responds 503 if file is not downloadable", async () => {
    return expect(
      axios.get(`${url}592a73d0-92a0-41d4-97c5-9f3e99ce33cb/20190715_bucharest_secret-lidar.nc`, {
        headers: { "X-Forwarded-For": "217.165.30.43" },
      }),
    ).rejects.toMatchObject(genResponse(503, { errors: ["File is not downloadable"] }));
  });
});

describe("GET /api/download/raw/:uuid/:filename", () => {
  const url = `${backendPublicUrl}download/raw/`;

  it("responds with 404 if file is not found", async () => {
    const expectedBody: RequestError = {
      status: 404,
      errors: ["File not found"],
    };
    return expect(axios.get(`${url}25506ea8-d357-4c7b-af8c-95dfcc34fc7d/test.nc`)).rejects.toMatchObject(
      genResponse(expectedBody.status, expectedBody),
    );
  });

  it("responds 404 if invalid uuid", async () => {
    return expect(axios.get(`${url}kisseliini/asd`)).rejects.toMatchObject(
      genResponse(404, { errors: ["Not found: invalid UUID"] }),
    );
  });

  it("responds 404 if file has 'created' status", async () => {
    return expect(
      axios.get(`${url}b8e96ee1-d3e1-49ba-a557-c131d56beeab/file1-dc460da4ad72c48223.LV1`),
    ).rejects.toMatchObject(genResponse(404, { errors: ["File not found"] }));
  });
});
