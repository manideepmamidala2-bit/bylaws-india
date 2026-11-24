import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { defineConfig } from "@playwright/test";

const cachedChrome = path.join(
  os.homedir(),
  ".cache",
  "ms-playwright",
  "chromium-1243",
  "chrome-linux64",
  "chrome"
);

export default defineConfig({
  testDir: "./e2e",
  timeout: 45_000,
  use: {
    baseURL: "http://127.0.0.1:3000",
    launchOptions: fs.existsSync(cachedChrome)
      ? {
          executablePath: cachedChrome,
          args: ["--use-gl=angle", "--use-angle=swiftshader"],
        }
      : {
          args: ["--use-gl=angle", "--use-angle=swiftshader"],
        },
  },
  webServer: {
    command: "npm run start -- -p 3000",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
