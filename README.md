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

The dataportal uses typeorm for automatic database schema manipulation. This repo provides a wrapper script for typeorm's own migration tool.

     cd backend
    ./run-dev scripts/typeorm

The migrations are stored in `backend/src/migration`. For more information on how to use typeorm's migrations, see: https://github.com/typeorm/typeorm/blob/master/docs/migrations.md

### Running unit and integration tests

The backend unit and integration tests are run with the commands:

    cd backend
    ./run-test npm test

Individual tests can be run as:

    cd backend
    ./run-test npx jest tests/integration/sequential/siteContact.test.ts

To run backend e2e-tests, issue

    cd backend
    ./run-test npm run e2e-test

The frontend unit and integration tests are run with:

    cd frontend
    ./run npm test

### Running code formatters

    WRAPPER npx prettier --write FILENAME
    WRAPPER npm run lint-fix

where `WRAPPER` is, depending on the backend or frontend, `./run-dev` or `./run`, respectively.

### License

MIT
