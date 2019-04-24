import express from "express";
import { PORT } from "./config";
import { listAllUsers } from "./helpers/crud";

const app = express();

app.get("/", (req, res) => res.json({ hello: "world" }));
app.get("/create-account", async (req, res) => {
  try {
    const users = await listAllUsers();
    res.json({ success: true, users });
  } catch (error) {
    console.log("Error", error);
    res.json({ success: false });
  }
});

app.listen(PORT, () => console.log("App running"));
