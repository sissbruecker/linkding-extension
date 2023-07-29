const jq = require("node-jq");
const fs = require("fs");
const path = require("path");

/* This script merges the common manifest with the browser-specific manifest.
  * Usage: node manifests/merge.js <browser> <output-dir>
  * Example: node manifests/merge.js chrome build/chrome
  */

const commonManifest = JSON.parse(
  fs.readFileSync("manifests/manifest.common.json", "utf8")
);
const browserManifest = JSON.parse(
  fs.readFileSync(`manifests/manifest.${process.argv[2]}.json`, "utf8")
);

jq.run(".[0] * .[1]", [commonManifest, browserManifest], {
  input: "json",
}).then((output) => {
  if (!fs.existsSync(process.argv[3])) {
    fs.mkdirSync(process.argv[3], { recursive: true });
  }
  fs.writeFileSync(path.join(process.argv[3], "manifest.json"), output);
});
