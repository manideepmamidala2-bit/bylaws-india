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

if (
  fs.existsSync(pmtilesPath) &&
  fs.existsSync(parentDocsPath) &&
  fs.existsSync(southRegisterPath) &&
  fs.existsSync(south230Path)
) {
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
