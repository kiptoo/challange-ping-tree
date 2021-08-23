var name = require("./package.json").name;
require("productionize")(name);
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
var server = require("./lib/server");
var redis = require("./lib/redis");
var logic = require("./lib");
var cors = require("corsify");
var port = process.env.PORT || 5000;

app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: false }));
// app.use(
//   cors({
//     credentials: false,
//     origin: ["http://localhost:5000", "http://192.168.100.6:5000"],
//   })
// );
app.post("/route", async (req, res, next) => {
  let reqdata = req.body;
  console.log(reqdata);
  // let data = await logic.postRoute("route:id-" + reqdata.id, reqdata);
  let data = await logic.postRoute(reqdata);
  console.log("All target record read successfully", data);

  res.send(data);
});
app.post("/targets", async (req, res, next) => {
  let reqdata = req.body;
  console.log(reqdata);
  // reqdata = JSON.stringify({ foo: "bar", hello: "world" });
  // reqdata = {
  //   id: "1",
  //   firstname: "evans",
  //   lastname: "kiptoo",
  //   age: "30",
  // };
  // reqdata = JSON.stringify({
  //   id: "1",
  //   url: "http://example.com",
  //   value: "0.50",
  //   maxAcceptsPerDay: "10",
  //   accept: {
  //     states: ["ca", "ny"],
  //     hour: ["13", "14", "15"],
  //   },
  // });

  let data = await logic.newTarget("target:id-" + reqdata.id, reqdata);
  console.log("new target saved successfully", data);
  res.send(data);
});
app.get("/targets", async (req, res, next) => {
  let reqdata = req.body;
  // let reqdata = req.params.id;
  let data = await logic.getTargets("Targets");
  console.log("return data", data);
  // let jsonData = JSON.parse(data);
  let jsonData = [];
  Object.keys(data).forEach((key) => {
    console.log("return key", key);
    let parseData = JSON.parse(data[key]);
    jsonData.push(parseData);
  });
  console.log("Get return jsonData", jsonData);
  if (!jsonData.length) {
    res.send("id not found");
  } else {
    res.send(jsonData);
  }
});

// server().listen(port);
app.listen(port, () => {
  console.log(name, "listening on port", port);
});
