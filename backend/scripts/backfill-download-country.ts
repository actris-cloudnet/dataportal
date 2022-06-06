import { Download } from "../src/entity/Download";
import { createConnection } from "typeorm";
import { getIpLookup } from "../src/lib";

async function main() {
  const ipLookup = await getIpLookup();
  const conn = await createConnection();
  const repo = conn.getRepository<Download>("download");
  const rows = await repo.createQueryBuilder().select("ip").distinct(true).where({ country: null }).getRawMany();
  for (const row of rows) {
    const country = ipLookup.get(row.ip)?.country?.iso_code;
    console.log(row.ip, "=>", country);
    if (country) {
      await repo.update({ ip: row.ip, country: null }, { country });
    }
  }
}

main().catch((err) => console.error(err));
