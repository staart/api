import express from "express";
import { PORT } from "./config";
import { register, verifyEmail } from "./rest/auth";

const app = express();

app.get("/", (req, res) => res.json({ hello: "world" }));
app.get("/create-account", async (req, res) => {
  try {
    const users = await register(
      { name: "Anand Chowdhary" },
      "anand@oswaldlabs.com"
    );
    res.json({ success: true, users });
  } catch (error) {
    console.log("Error", error);
    res.json({ success: false });
  }
});
app.get("/verify-email/:token", async (req, res) => {
  try {
    res.json({ success: await verifyEmail(req.params.token) });
  } catch (error) {
    console.log("Error", error);
    res.json({ success: false });
  }
});

app.listen(PORT, () => console.log("App running"));
