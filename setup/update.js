var shell = require("shelljs");

if (!shell.which("git")) {
  shell.echo("Sorry, this script requires git");
  shell.exit(1);
}

if (shell.exec("git pull git@github.com:staart/api").code !== 0) {
  shell.echo("Error: Git commit failed");
  shell.exit(1);
}
