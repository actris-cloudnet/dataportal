import "reflect-metadata";
import { DataSource } from "typeorm";
import env from "./lib/env";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: env.TYPEORM_HOST,
  username: env.TYPEORM_USERNAME,
  password: env.TYPEORM_PASSWORD,
  database: env.TYPEORM_DATABASE,
  port: env.TYPEORM_PORT,
  synchronize: env.TYPEORM_SYNCHRONIZE,
  migrations: ["src/migration/*.ts"],
  migrationsRun: true,
  logging: false,
  entities: ["src/entity/*.ts"],
});
