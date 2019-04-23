import express from "express";
// import { create } from "./helpers/crud";

const app = express();

app.get("/", (req, res) => res.json({ hello: "world" }));
app.get("/create-account", async (req, res) => {
  try {
    // res.json({ success: true, data: await create() });
    res.json({ success: true });
  } catch (error) {
    console.log("Error", error);
    res.json({ success: false });
  }
});

app.listen(process.env.PORT || 7007, () => console.log("App running"));
