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
    if (country) {
      console.log(`UPDATE "download" SET "country" = '${country}' WHERE "ip" = '${row.ip}' AND "country" IS NULL;`);
    }
  }
}

main().catch((err) => console.error(err));
