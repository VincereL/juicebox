const PORT = 3000;
const express = require("express");
const server = express();
const { client } = require("./db");
client.connect();
const apiRouter = require("./api");
const morgan = require("morgan");

server.use(morgan("dev"));

server.use(express.json());

server.use((req, res, next) => {
  console.log("Start up");
  console.log(req.body);
  console.log("End");

  next();
});

server.use("/api", apiRouter);
server.listen(PORT, () => {
  console.log("The server is up on port", PORT);
});
