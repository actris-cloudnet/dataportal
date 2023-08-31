import { backendPublicUrl, genResponse } from "../../lib";
import { RequestError } from "../../../src/entity/RequestError";
import axios from "axios";

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
});
