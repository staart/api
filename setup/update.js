const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const packageUrl =
  "https://raw.githubusercontent.com/o15y/staart/master/package.json";

const checkUpdate = async () => {
  const pkg = (await axios.get(packageUrl)).data;
  const v = (await fs.readFile(
    path.join(__dirname, "..", "src", "internal", "staart-version")
  )).toString();
  console.log("Most recent version is", pkg.version);
  console.log("Your version is", v);
  if (v !== pkg.version) {
    console.log("Update required");
  }
  return;
};

checkUpdate()
  .then(() => {})
  .catch(error => console.log("ERROR", error));
