/**
 * One-time migration script to import instrument PI contacts from InstrumentDB
 * into the local InstrumentContact table.
 *
 * Usage:
 *   INSTRUMENTDB_URL=https://instrumentdb.example.com ./run-dev npx ts-node scripts/import-instrument-contacts.ts
 *
 * The script is idempotent: it skips contacts that already exist.
 */

import "reflect-metadata";
import axios from "axios";
import { AppDataSource } from "../src/data-source";
import { InstrumentInfo } from "../src/entity/Instrument";
import { InstrumentContact } from "../src/entity/InstrumentContact";
import { Person } from "../src/entity/Person";

interface InstrumentPiResponse {
  first_name: string;
  last_name: string;
  orcid_id: string | null;
  start_date: string | null;
  end_date: string | null;
}

async function main() {
  const instrumentdbUrl = process.env.INSTRUMENTDB_URL;
  if (!instrumentdbUrl) {
    console.error("INSTRUMENTDB_URL environment variable is required");
    process.exit(1);
  }

  await AppDataSource.initialize();
  console.log("Connected to database");

  const instrumentInfoRepo = AppDataSource.getRepository(InstrumentInfo);
  const personRepo = AppDataSource.getRepository(Person);
  const contactRepo = AppDataSource.getRepository(InstrumentContact);

  const instruments = await instrumentInfoRepo.find();
  console.log(`Found ${instruments.length} instruments`);

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const instrument of instruments) {
    try {
      const url = `${instrumentdbUrl}/instrument/${instrument.uuid}/pi`;
      const res = await axios.get<InstrumentPiResponse[]>(url, { timeout: 10_000 });
      const pis = res.data;

      if (!Array.isArray(pis) || pis.length === 0) continue;

      for (const pi of pis) {
        // Find or create a Person record
        let person: Person | null = null;

        if (pi.orcid_id) {
          const normalizedOrcid = pi.orcid_id.replace(/^(https?:\/\/)?(www\.)?orcid\.org\//, "");
          person = await personRepo.findOneBy({ orcid: normalizedOrcid });
          if (!person) {
            person = personRepo.create({
              firstname: pi.first_name,
              surname: pi.last_name,
              orcid: normalizedOrcid,
            });
            person = await personRepo.save(person);
          }
        } else {
          // Try to match by name
          person = await personRepo.findOneBy({ firstname: pi.first_name, surname: pi.last_name });
          if (!person) {
            person = personRepo.create({ firstname: pi.first_name, surname: pi.last_name });
            person = await personRepo.save(person);
          }
        }

        // Check if contact already exists
        const existing = await contactRepo.findOneBy({
          instrumentInfoUuid: instrument.uuid,
          personId: person.id,
        });

        if (existing) {
          skipped++;
          continue;
        }

        const contact = contactRepo.create({
          instrumentInfoUuid: instrument.uuid,
          personId: person.id,
          startDate: pi.start_date ?? null,
          endDate: pi.end_date ?? null,
        });
        await contactRepo.save(contact);
        created++;
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        // Instrument not found in instrumentdb, skip silently
      } else {
        console.error(`Error fetching PIs for ${instrument.uuid}: ${err.message}`);
        errors++;
      }
    }
  }

  await AppDataSource.destroy();
  console.log(`Done. Created: ${created}, Skipped: ${skipped}, Errors: ${errors}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
