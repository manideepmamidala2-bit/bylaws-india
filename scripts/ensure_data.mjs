#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";

const repoRoot = process.cwd();
const publicDataDir = path.join(repoRoot, "public", "data");
const pmtilesPath = path.join(
  publicDataDir,
  "in-ka-bengaluru-south",
  "basemap.pmtiles"
);
const parentDocsPath = path.join(
  publicDataDir,
  "in-ka-bengaluru",
  "4.0.0",
  "documents.json"
);
const parentParamsPath = path.join(
  publicDataDir,
  "in-ka-bengaluru",
  "4.0.0",
  "parameters.json"
);
const northParamsPath = path.join(
  publicDataDir,
  "in-ka-bengaluru-north",
  "4.0.0",
  "parameters.json"
);
const southRegisterPath = path.join(
  publicDataDir,
  "in-ka-bengaluru-south",
  "register",
  "documents.json"
);
const south230Path = path.join(
  publicDataDir,
  "in-ka-bengaluru-south",
  "2.3.0",
  "documents.json"
);
const southResolutionPath = path.join(
  publicDataDir,
  "in-ka-bengaluru-south",
  "4.0.0",
  "resolution.json"
);
const southRelationsPath = path.join(
  publicDataDir,
  "in-ka-bengaluru-south",
  "4.0.0",
  "relations.json"
);

function isExistingDataConsistent() {
  if (
    !fs.existsSync(pmtilesPath) ||
    !fs.existsSync(parentDocsPath) ||
    !fs.existsSync(parentParamsPath) ||
    !fs.existsSync(northParamsPath) ||
    !fs.existsSync(southRegisterPath) ||
    !fs.existsSync(south230Path) ||
    !fs.existsSync(southResolutionPath) ||
    !fs.existsSync(southRelationsPath)
  ) {
    return false;
  }
  try {
    const parentParams = JSON.parse(fs.readFileSync(parentParamsPath, "utf8"));
    const northParams = JSON.parse(fs.readFileSync(northParamsPath, "utf8"));
    const southResolution = JSON.parse(
      fs.readFileSync(southResolutionPath, "utf8")
    );
    const southRelations = JSON.parse(
      fs.readFileSync(southRelationsPath, "utf8")
    );
    const pRecs = parentParams.records || [];
    const nRecs = northParams.records || [];
    if (pRecs.length === 0 || pRecs.length !== nRecs.length) {
      return false;
    }
    if (
      !Array.isArray(southResolution.no_limit_in_law_rules) ||
      southResolution.no_limit_in_law_rules.length === 0 ||
      !southRelations.public_visibility_rule
    ) {
      return false;
    }
    return pRecs[0]?.parameter_id === nRecs[0]?.parameter_id;
  } catch {
    return false;
  }
}

if (isExistingDataConsistent()) {
  process.exit(0);
}

const tag = process.env.BYLAWS_DATA_TAG || "data-v4.0.0";
const bundleUrl =
  process.env.BYLAWS_DATA_BUNDLE_URL ||
  `https://github.com/manideepmamidala2-bit/bylaws-india/releases/download/${tag}/bylaws-india-data-bundle.tar.gz`;

console.log(`[ensure_data] Downloading published data bundle from ${bundleUrl}...`);
const response = await fetch(bundleUrl);
if (!response.ok) {
  throw new Error(
    `Failed to download data bundle from ${bundleUrl}: HTTP ${response.status}`
  );
}

const tmpArchive = path.join(os.tmpdir(), `bylaws-data-${Date.now()}.tar.gz`);
const arrayBuf = await response.arrayBuffer();
fs.writeFileSync(tmpArchive, Buffer.from(arrayBuf));
fs.mkdirSync(publicDataDir, { recursive: true });
execFileSync("tar", ["-xzf", tmpArchive, "-C", publicDataDir], {
  stdio: "inherit",
});
fs.unlinkSync(tmpArchive);
console.log(`[ensure_data] Extracted published data into ${publicDataDir}.`);
