# ACTRIS Cloudnet data portal
![](https://github.com/actris-cloudnet/dataportal/workflows/Lint%20and%20test/badge.svg)
![](https://github.com/actris-cloudnet/dataportal/workflows/Selenium%20test/badge.svg)

This repository contains the source code for ACTRIS Cloudnet data portal hosted at https://cloudnet.fmi.fi.
The API documentation can be found [here](https://actris-cloudnet.github.io/dataportal/).

## Install

The data portal is distributed as a docker container as a part of the Cloudnet development toolkit.
See the instructions for installing the toolkit [here](https://github.com/actris-cloudnet/dev-toolkit/).


## Running commands in the container

For running commands in the data portal containers, small wrapper scripts are provided at `backend/run-dev`, `backend/run-test` and `frontend/run`,
for running commands in the backend development, backend test, and frontend development containers, respectively.
Before using these scripts make sure the containers are up.

### Populating the database

By default, there is no data in the portal's database. The following command will populate the development
database with test fixtures:

    cd backend
    ./run-dev npm run reset-db


### Running unit and integration tests
    
The backend unit and integration tests are run with the commands:

    cd backend
    ./run-test npm test

To run backend e2e-tests, issue

    cd backend
    ./run-test npm run e2e-test
    
The frontend unit and integration tests are run with:

    cd frontend
    ./run npm test
    
    
### Running selenium tests

In addition to unit and integration tests, the project includes selenium tests.

    
To run selenium tests testing both backend and frontend, issue

    cd .github
    SELENIUM_TEST_TARGET=tests/selenium docker-compose run test-selenium
    
    

### License
MIT
