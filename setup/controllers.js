const fs = require("fs-extra");
const path = require("path");
const yaml = require("yaml");

const SRC = path.join(__dirname, "..", "src");
let server = fs.readFileSync(path.join(SRC, "server.ts")).toString();

const controllers = fs.readdirSync(path.join(SRC, "controllers"));
const exportName = [];
controllers.forEach(controller => {
  const controllerFile = fs
    .readFileSync(path.join(SRC, "controllers", controller))
    .toString();
  exportName.push(controllerFile.split("export class ")[1].split(" ")[0]);
});

const importCode = `${exportName
  .map(
    (e, i) =>
      `import { ${e} } from "./controllers/${controllers[i].split(".ts")[0]}";`
  )
  .join("\n")}`;

const insertCode = `
  super.addControllers([${exportName.map(e => `new ${e}()`).join(", ")}]);
`;
server = importCode + server.replace("// staart:setup/controllers", insertCode);
console.log("✅  Generated paths");

const redirects = yaml.parse(
  fs.readFileSync(path.join(SRC, "redirects.yml")).toString()
);

const redirectCode = `
  ${redirects
    .map(
      rule => `
    this.app.get("${rule.split(" ")[0]}", (req, res) => res.redirect("${
        rule.split(" ")[1]
      }"));
  `
    )
    .join("")}
`;
server = server.replace("// staart:setup/redirects", redirectCode);
console.log("✅  Generated redirects");

fs.writeFileSync(path.join(SRC, "app.ts"), server);
process.exit(0);
