import { DataSource } from "typeorm";
import { promises as fsp } from "fs";
import { basename, join } from "path";
import { argv } from "process";
import { AppDataSource } from "./data-source";

const truncate = argv[3] ? argv[3] == "TRUNCATE" : false;

const isJson = (filepath: string) => filepath.substring(filepath.length - 4) == "json";

async function handleFile(dataSource: DataSource, filepath: string) {
  const repoName = basename(filepath).split("-")[1].split(".")[0];
  const repo = dataSource.getRepository(repoName);
  if (truncate) await repo.query(`TRUNCATE TABLE ${repoName} RESTART IDENTITY CASCADE`);
  return repo.save(JSON.parse((await fsp.readFile(filepath)).toString()));
}

async function handleDir(dataSource: DataSource, dirpath: string) {
  const fixtureFiles = (await fsp.readdir(dirpath))
    .filter(isJson)
    .sort()
    .map((filename) => join(dirpath, filename));

  console.log("Reading fixtures from", fixtureFiles.length, "files");
  for (const filepath of fixtureFiles) {
    await handleFile(dataSource, filepath);
  }
}

async function importFixture(path: string) {
  const dataSource = await AppDataSource.initialize();
  const stat = await fsp.lstat(path);
  if (stat.isDirectory()) return handleDir(dataSource, path);
  else if (stat.isFile() && isJson(path)) return handleFile(dataSource, path);
  else throw "Unknown file type";
}

if (truncate) {
  console.log("NOTE: Truncating all existing data");
}

importFixture(argv[2])
  .then(() => {
    console.log("Success!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("FATAL:", err);
    process.exit(1);
  });
