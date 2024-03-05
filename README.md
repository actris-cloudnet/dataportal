# ACTRIS Cloudnet data portal

[![Lint and test](https://github.com/actris-cloudnet/dataportal/actions/workflows/test.yml/badge.svg)](https://github.com/actris-cloudnet/dataportal/actions/workflows/test.yml)

This repository contains the source code for ACTRIS Cloudnet data portal hosted at https://cloudnet.fmi.fi.

## Install

The data portal is distributed as a docker container as a part of the Cloudnet development toolkit.
Refer to [README of the dev-toolkit repository](https://github.com/actris-cloudnet/dev-toolkit/)
on how to set up the CLU development environment.

### Development dependencies

Install [pre-commit](https://pre-commit.com/#install) to your machine and run `pre-commit install` to set up the hooks.

## Running commands in the container

For running commands in the data portal containers, small wrapper scripts are provided at `backend/run-dev`, `backend/run-test` and `frontend/run`,
for running commands in the backend development, backend test, and frontend development containers, respectively.
Before using these scripts make sure the containers are up.

### Populating the database

By default, there is no data in the portal's database. The following command will populate the development
database with test fixtures:

    cd backend
    ./run-dev npm run reset-db

To load other data to the db, for instance the sites used in production, use:

    cd backend
    ./run-dev npx ts-node -T src/fixtures.ts /dataportal-resources/1-site.json

### Migrations

The dataportal uses TypeORM for automatic database schema manipulation. This repository provides wrapper scripts for TypeORM's own migration tool:

     cd backend
    ./run-dev npm run migration:show
    ./run-dev npm run migration:run
    ./run-dev npm run migration:revert
    ./run-dev npm run migration:generate -- src/migration/NewMigration
    ./run-dev npm run migration:create -- src/migration/NewMigration
    ./run-dev npm run typeorm -- --help

The migrations are stored in `backend/src/migration`. For more information on how to use TypeORM's migrations, see <https://typeorm.io/migrations>.

### Running unit and integration tests

The backend unit and integration tests are run with the commands:

    cd backend
    ./run-test npm test

Individual tests can be run as:

    cd backend
    ./run-test sh -c "npm run reset-db && npx jest tests/integration/sequential/siteContact.test.ts"

To run backend e2e-tests, issue

    cd backend
    ./run-test npm run e2e-test

The frontend unit and integration tests are run with:

    cd frontend
    ./run npm run test:unit

### Running code formatters

    WRAPPER npx prettier --write FILENAME
    WRAPPER npm run lint-fix

where `WRAPPER` is, depending on the backend or frontend, `./run-dev` or `./run`, respectively.

### License

MIT
