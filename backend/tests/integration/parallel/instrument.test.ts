import { backendPublicUrl } from "../../lib";
import axios from "axios";
import { readResources } from "../../../../shared/lib";

describe("/api/instruments", () => {
  const url = `${backendPublicUrl}instruments`;
  let responses: any;

  beforeAll(async () => (responses = await readResources()));

  it("responds with a json including products", async () => {
    const res = await axios.get(url);
    return expect(res.data).toMatchObject(responses["instruments"]);
  });
});
