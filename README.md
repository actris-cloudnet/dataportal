# ACTRIS Cloudnet data portal
![](https://github.com/actris-cloudnet/dataportal/workflows/Test/badge.svg)

This repository contains the source code for ACTRIS Cloudnet data portal hosted at https://cloudnet.fmi.fi.
The API documentation can be found [here](https://actris-cloudnet.github.io/dataportal/).


### Requirements

- Postgresql
- Zsh
- NetCDF binaries
- Nginx
- [Node version manager](https://github.com/nvm-sh/nvm) (with Node.js v10 installed)
- Geckodriver (for selenium tests)

On detailed steps on how to install and configure the required software on a Linux system, please see
[Github actions workflow file](.github/workflows/test.yml).


### Installation

The software is installed and managed through the `control`-script at the project root. To install, issue

    ./control install

This will install the npm packages required for the frontend and the backend.


### Starting/stopping services

All of the following commands are run from the project root.
Once the software has been installed, the development server may be started with the command

    ./control start
    
This will start the backend server at `http://localhost:3000`.
The server will restart on changes made to the source files. In development work, is usually a good idea to also start
a typescript compiler that will compile the source files on changes:

    cd backend
    npx tsc --build tsconfig.json -w

To start the frontend development server, issue the following commands at project root

    cd frontend
    npm run serve
    
You should now be able to view the dataportal at `http://localhost:8080`. Changes made to the source files
should be immediately visible in the browser.

To stop or restart the backend development server, use `./control stop` and `./control restart` at project root.


### Populating the database

By default, there is no data in the portal's database. The following command will populate the development
database with test fixtures:

    cd backend
    npx ts-node -T src/fixtures.js default fixtures

Note: the project will have to be built prior to running this command.


### Running unit and integration tests
First, start the test server with

    ./control test-start
    
The backend unit and integration tests are run with the commands:

    cd backend
    npm test
    
The frontend unit and integration tests are run with:

    cd frontend
    npm test
    
    
### Running end-to-end and selenium tests

In addition to unit and integration tests, the project includes e2e and selenium tests.
First, ensure that the test server is running (see previous section).

To run backend e2e-tests, issue

    cd backend
    npm run e2e-test
    
To run selenium tests testing both backend and frontend, issue

    ./control selenium-test
    
    
### Control commands

This is a disambiguation of the `./control` commands at your disposal.

| command | description |
|---------|-------------|
| `install` | install the project and dependencies. |
| `start` | start development server at port `3000`. |
| `stop` | stop development server. |
|`restart` | restart development server. |
|`test-start` | start test server at port `3001`. |
|`test-stop` | stop test server. |
|`test-restart` | restart test server. |
|`build`| make a clean build of the project. |
|`lint`| lint both backend and frontend. |
|`clean` | clean pid files of started processes. Useful if you are getting a timeout error on `./control start`. |
|`purge` | remove all built files, node modules, and drop databases. A reinstall is required after issuing this command. |
|`ci` | install the project in a continuous integration environment. |
|`selenium-test`| build the project and run selenium tests. |
|`reset-db`| drop development database and instantiate it again. |

For CLU internal use:

|`fetch-remote-db` | retrieve remote database to development environment. |
|`fetch-and-start` | retrieve remote database and start. |

### License
MIT
