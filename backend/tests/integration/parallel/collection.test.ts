import axios from "axios";
import { backendPublicUrl, genResponse } from "../../lib";
import { describe, expect, it } from "@jest/globals";

const url = `${backendPublicUrl}collection/`;
const validCollectionUuid = "48092c00-161d-4ca2-a29d-628cf8e960f6";

describe("GET /api/collection/:uuid", () => {
  it("returns a valid collection", async () => {
    const res = await axios.get(`${url}${validCollectionUuid}`);
    expect(res.data).toMatchSnapshot();
  });

  it("responds 404 if invalid uuid", async () => {
    return expect(axios.get(`${url}kisseliini`)).rejects.toMatchObject(
      genResponse(404, { errors: ["Not found: invalid UUID"] }),
    );
  });

  it("responds 404 if collection is not found", async () => {
    return expect(axios.get(`${url}88092c00-161d-4ca2-a29d-628cf8e960f6`)).rejects.toMatchObject(
      genResponse(404, { errors: ["Collection not found"] }),
    );
  });
});

describe("GET /api/collection/:uuid/files", () => {
  it("returns collection files", async () => {
    const res = await axios.get(`${url}${validCollectionUuid}/files`);
    expect(res.data).toMatchSnapshot();
  });
});
