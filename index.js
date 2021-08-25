var name = require("./package.json").name;
require("productionize")(name);
const express = require("express");
const app = express();
const config = require("./config");
var server = require("./lib/server");
var redis = require("./lib/redis");
var logic = require("./lib");
var cors = require("corsify");
var port = config.serverport || 5000;
// redis.select(2);

app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);
// app.use(
//   cors({
//     credentials: false,
//     origin: [
//       "http://localhost:5000",
//       "http://192.168.100.6:5000",
//       "http://192.168.100.2:5000",
//     ],
//   })
// );
app.post("/route", async (req, res, next) => {
  let reqdata = req.body;

  let data = await logic.postRoute(reqdata);

  res.status(200).send(data);
});
app.post("/api/targets", async (req, res, next) => {
  let reqdata = req.body;
  let data = await logic.newTarget(reqdata);
  if (data.status == 400) res.status(400).send({ status: data.msg });
  res.status(200).send({ status: data.msg });
});
app.post("/api/target/:id", async (req, res, next) => {
  let id = req.params.id;
  let reqdata = req.body;

  let data = await logic.updateTarget(id, reqdata);
  if (data.status == 400) res.status(400).send({ status: data.msg });
  res.status(200).send({ status: data.msg });
});
app.get("/api/get_byid/:id", async (req, res, next) => {
  let reqdata = req.params.id;

  let data = await logic.getTargetById(reqdata);

  res.status(200).send(data);
});
app.get("/api/targets", async (req, res, next) => {
  let data = await logic.getTargets("Targets");

  res.status(200).send(data);
});

app.listen(port, () => {
  console.log(name, "listening on port", port);
});
module.exports = app;
