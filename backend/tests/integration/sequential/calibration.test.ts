import axios from "axios";
import { backendPrivateUrl } from "../../lib";
import { Connection, createConnection, Repository } from "typeorm";
import { Calibration } from "../../../src/entity/Calibration";

let conn: Connection;
let repo: Repository<Calibration>;
const url = `${backendPrivateUrl}calibration/`;

describe("POST /calibration", () => {
  beforeAll(async () => {
    conn = await createConnection();
    repo = conn.getRepository("calibration");
  });

  beforeEach(async () => {
    await repo.delete({});
  });

  afterAll(() => conn.close());

  it("on valid new calibration inserts it to the table", async () => {
    await axios.post(url, { site: "hyytiala", instrument: "mira", date: "2021-01-01", calibrationFactor: 0.5 });
    await expect(repo.findOneOrFail()).resolves.toBeTruthy();
  });

  it("inserts two calibrations for same date", async () => {
    await axios.post(url, { site: "hyytiala", instrument: "mira", date: "2021-01-01", calibrationFactor: 0.5 });
    await axios.post(url, { site: "hyytiala", instrument: "mira", date: "2021-01-01", calibrationFactor: 0.8 });
    const res = await repo.findOneOrFail();
    expect(res.calibration.length).toEqual(2);
  });

  it("sets calibration for all dates between existing and new calibration", async () => {
    await axios.post(url, { site: "hyytiala", instrument: "mira", date: "2021-01-01", calibrationFactor: 0.5 });
    await axios.post(url, { site: "hyytiala", instrument: "mira", date: "2021-01-03", calibrationFactor: 0.8 });
    const res = await repo.find({ where: { site: "hyytiala" }, order: { measurementDate: "ASC" } });
    expect(res.length).toEqual(3);
    expect(res[0].calibration[0].calibrationFactor).toEqual(0.5);
    expect(res[1].calibration[0].calibrationFactor).toEqual(0.5);
    expect(res[2].calibration[0].calibrationFactor).toEqual(0.8);
    await repo.delete({});
    await axios.post(url, { site: "hyytiala", instrument: "mira", date: "2021-01-01", calibrationFactor: 0.5 });
    await axios.post(url, { site: "hyytiala", instrument: "mira", date: "2021-01-02", calibrationFactor: 0.8 });
    const res2 = await repo.find({ where: { site: "hyytiala" }, order: { measurementDate: "ASC" } });
    expect(res2.length).toEqual(2);
    expect(res2[0].calibration[0].calibrationFactor).toEqual(0.5);
    expect(res2[1].calibration[0].calibrationFactor).toEqual(0.8);
  });
});
