import { DataSource } from "typeorm";
import { promises as fsp } from "fs";
import { basename, join } from "path";
import { argv } from "process";
import { AppDataSource } from "./data-source";

import readline = require("node:readline/promises");
import process = require("node:process");

const action = argv[3];
if (action != "SYNC" && action != "APPEND" && action != "TRUNCATE") {
  console.error("Action missing: SYNC, APPEND or TRUNCATE");
  process.exit(1);
}
if (action == "TRUNCATE") {
  console.log("NOTE: Truncating all existing data");
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const isJson = (filepath: string) => filepath.substring(filepath.length - 4) == "json";

async function handleFile(dataSource: DataSource, filepath: string) {
  const repoName = basename(filepath).split("-")[1].split(".")[0];
  const repo = dataSource.getRepository(repoName);
  console.log(`Processing ${repoName}...`);
  if (action == "TRUNCATE") {
    await repo.query(`TRUNCATE TABLE ${repoName} RESTART IDENTITY CASCADE`);
  }

  const primaryColumns = repo.metadata.primaryColumns.map((column) => column.propertyName);
  function getId(obj: any) {
    const id: any = {};
    for (const column of primaryColumns) {
      id[column] = obj[column];
    }
    return id;
  }

  const fixtures = JSON.parse(await fsp.readFile(filepath, { encoding: "utf-8" }));
  if (action === "SYNC") {
    const insertObjs = [];
    const updateObjs = [];
    const existingIds = (await repo.find()).reduce((obj, row) => {
      const id = getId(row);
      obj[JSON.stringify(id)] = id;
      return obj;
    }, {});
    for (const fixture of fixtures) {
      const id = getId(fixture);
      if (JSON.stringify(id) in existingIds) {
        updateObjs.push([id, fixture]);
      } else {
        insertObjs.push([id, fixture]);
      }
      delete existingIds[JSON.stringify(id)];
    }
    const deleteIds = Object.values(existingIds);

    if (insertObjs.length + updateObjs.length + deleteIds.length == 0) {
      console.log("Nothing to do...");
      return;
    }
    if (insertObjs.length > 0) {
      console.log(
        "Insert:",
        insertObjs.map((a) => a[0]),
      );
    }
    if (updateObjs.length > 0) {
      console.log("Update:", updateObjs.length, updateObjs.length == 1 ? "entity" : "entities");
    }
    if (deleteIds.length > 0) {
      console.log("Delete:", deleteIds);
    }

    const answer = await rl.question("Apply changes to database? [y/n] ");
    if (answer.toLowerCase() != "y") {
      console.log("I guess not then...");
      return;
    }

    for (const id of deleteIds) {
      await repo.delete(id);
    }
    await repo.save([...insertObjs.map((a) => a[1]), ...updateObjs.map((a) => a[1])]);
  } else {
    await repo.save(fixtures);
  }
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
  if (stat.isDirectory()) await handleDir(dataSource, path);
  else if (stat.isFile() && isJson(path)) await handleFile(dataSource, path);
  else throw "Unknown file type";
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
