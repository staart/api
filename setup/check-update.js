const dotenv = require("dotenv");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const shell = require("shelljs");
const hasYarn = require("has-yarn");
const { info, warn, error } = require("@staart/errors");
const yourPkg = require("../package.json");

dotenv.config();
const packageUrl =
  "https://raw.githubusercontent.com/staart/api/master/package.json";

const versionToNum = version => parseInt(version.replace(/\./g, ""));

const checkUpdate = async () => {
  const pkg = (await axios.get(packageUrl)).data;
  const v = yourPkg["staart-version"];
  if (versionToNum(v) < versionToNum(pkg.version)) {
    info("Most recent version is", pkg.version);
    info("Your version is", v);
    warn(`🚨  Staart update required (v)"`);
  }
  const i = JSON.parse(
    (await fs.readFile(path.join(__dirname, "..", "package.json"))).toString()
  );
  if (
    i.name !== "@staart/manager" &&
    !Object.keys(i.devDependencies).includes("@staart/manager")
  ) {
    if (process.env.USE_NPM || !hasYarn()) {
      shell.exec("npm install --save-dev @staart/manager");
    } else {
      shell.exec("yarn add -D @staart/manager");
    }
  }
  return;
};

checkUpdate()
  .then(() => {})
  .catch(err => error("ERROR", err));
