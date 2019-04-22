import express from "express";
import { register } from "../src/rest/auth";
const app = express();

import "reflect-metadata";
import { connect } from "../src/helpers/database";
connect().then(a => {
  console.log(a);
});

app.get("/", (req, res) => res.json({ hello: "world" }));
app.get("/create-account", async (req, res) => {
  try {
    await register();
    res.json({ created: true });
  } catch (error) {
    console.log(error);
    res.json({ error: true });
  }
});

app.listen(process.env.PORT || 7007, () => console.log("App running"));
