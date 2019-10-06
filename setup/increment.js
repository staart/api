const fs = require("fs-extra");
const path = require("path");
const { error } = require("signale");

const incrementVersion = async () => {
  const pkg = JSON.parse(
    (await fs.readFile(path.join(__dirname, "..", "package.json"))).toString()
  );
  const newVersion = pkg.version
    .split(".")
    .map((a, i) => (i === 2 ? parseInt(a) + 1 : a))
    .join(".");
  pkg.version = newVersion;
  if (pkg.name === "@staart/manager") pkg["staart-version"] = newVersion;
  await fs.writeFile(
    path.join(__dirname, "..", "package.json"),
    JSON.stringify(pkg, null, 2)
  );
};

incrementVersion()
  .then(() => {})
  .catch(err => error(err))
  .then(() => process.exit(0));
