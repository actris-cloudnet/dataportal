const express = require("express");

// Storage-service
let serverMemory = {};
const storageApp = express();

storageApp.put("/*", (req, res, _next) => {
  const path = req.params[0];
  console.log("PUT", path);

  const chunks = [];
  req.on("data", (chunk) => {
    const chunkStr = chunk.toString();
    if (chunkStr === "invalidhash") return res.status(400).send("Checksum does not match file contents");
    if (chunkStr === "servererr") return res.sendStatus(400);
    chunks.push(chunk);
  });
  req.on("error", console.error);
  req.on("end", () => {
    if (!res.headersSent) {
      serverMemory[path] = Buffer.concat(chunks);
      res.status(201).send({ size: serverMemory[path].length });
    }
  });
});

storageApp.get("/*", (req, res, _next) => {
  const path = req.params[0];
  if (!(path in serverMemory)) return res.sendStatus(404);
  res.send(serverMemory[path]);
});

storageApp.delete("/", (req, res, _next) => {
  serverMemory = {};
  res.sendStatus(200);
});

storageApp.listen(5920, () => console.log("Storage service mock running"));

// PID-service
const validRequest = {
  type: "collection",
  uuid: "48092c00-161d-4ca2-a29d-628cf8e960f6",
};
const response = { pid: "testpid" };

const pidApp = express();
pidApp.post("/pid", express.json(), (req, res, _next) => {
  if (req.body.type != validRequest.type || req.body.uuid != validRequest.uuid) return res.sendStatus(400);
  if (!req.body.wait) res.send(response);
});
pidApp.listen(5801, () => console.log("PID service mock running"));

const dataciteApp = express();
dataciteApp.post("/dois", express.json({ type: "application/vnd.api+json" }), (req, res, _next) => {
  res.send(req.body);
});
dataciteApp.listen(5802, () => console.log("DataCite mock running"));

const labellingApp = express();
labellingApp.get("/api/facilities/:id/contacts", (req, res, _next) => {
  res.send([
    {
      first_name: "Björn",
      last_name: "Buchareström",
      orcid_id: null,
      start_date: "2019-01-01",
      end_date: null,
      role: "pi",
    },
  ]);
});
labellingApp.listen(5803, () => console.log("Labelling mock running"));

const handleApp = express();
handleApp.get("/handles/123/:suffix", (req, res, _next) => {
  res.send({ values: [{ type: "URL", data: { value: `http://localhost:5805/instrument/${req.params.suffix}` } }] });
});
handleApp.listen(5804, () => console.log("Handle API mock running"));

const instrumentdbApp = express();
instrumentdbApp.get("/instrument/:uuid/pi", (req, res, _next) => {
  let pis = [];
  if (req.params.uuid === "bucharest_lidar") {
    pis = [{ first_name: "Jean-Luc", last_name: "Picard", orcid_id: null, start_date: "2019-01-01", end_date: null }];
  } else if (req.params.uuid === "bucharest_radar") {
    pis = [
      { first_name: "Christopher", last_name: "Pike", orcid_id: null, start_date: null, end_date: "2018-12-31" },
      { first_name: "James Tiberius", last_name: "Kirk", orcid_id: null, start_date: "2019-01-01", end_date: null },
    ];
  }
  res.send(pis);
});
instrumentdbApp.listen(5805, () => console.log("InstrumentDB mock running"));

// TODO: citation-service?
