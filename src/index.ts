import path from "path";
import { URL, pathToFileURL } from "url";
import * as fs from "fs";

import { parseJS } from "@discordWebDownloader/utils/parseJS.js";
import {
  detectAssets,
  fetchAssets,
} from "@discordWebDownloader/utils/download.js";
import { flattenRegexArray } from "@discordWebDownloader/utils/flattenRegexArray.js";
import { determineDownloadUrlOrder } from "@discordWebDownloader/utils/determineDownloadUrlOrder.js";

const timer = (ms: number) => new Promise((res) => setTimeout(res, ms));

async function loopMatchingAssets(
  assets: any[],
  waybackDate?: string,
  date?: string
) {
  if (assets) {
    for (const asset of assets) {
      const outputPath = date
        ? path.join(rootFolder, "out", date, asset)
        : path.join(rootFolder, "out", asset);
      if (fs.existsSync(outputPath)) {
        continue;
      }
      console.log(`[index] Downloading: ${asset}`);
      const urls = determineDownloadUrlOrder(asset, waybackDate, date);
      switch (path.extname(asset)) {
        case ".js": {
          await parseJS(asset, waybackDate);
          break;
        }
        case ".css": {
          const assets = await detectAssets(
            urls,
            asset,
            /\/assets\/[\w\.]*[0-9a-f]+\.\w+/g,
            date
          );
          if (assets)
            await loopMatchingAssets(
              flattenRegexArray(Array.from(assets)),
              waybackDate,
              date
            );
          break;
        }
        default: {
          let finished;
          for (const url of urls) {
            if (!finished) {
              finished = await fetchAssets(asset, url, date);
            }
          }
          break;
        }
      }
      await timer(1000);
    }
  }
}

globalThis.assets = [];

let assets;

const rootFolder = path.join(import.meta.dirname, "..");
const scrapeFile = path.join(rootFolder, "scrape.txt");

async function start(assets: any, waybackDate?: string, date?: string) {
  if (assets)
    await loopMatchingAssets(
      flattenRegexArray(Array.from(assets)),
      waybackDate,
      date
    );
  for (let i = 0; i <= globalThis.assets.length; i++) {
    await loopMatchingAssets(globalThis.assets[i], waybackDate, date);
  }
}

if (!process.argv[2]) {
  console.error("Error: please mention release channel");
}

if (!process.argv[3] || process.argv[3] === "false") {
  const captures = JSON.parse(
    fs.readFileSync(scrapeFile, {
      encoding: "utf-8",
    })
  );

  for (const capture of captures) {
    globalThis.date = capture.firstCapture;
    globalThis.assets = [];
    const convertedDate = new Date(Date.parse(capture.firstCapture));
    const waybackDate = `${convertedDate.getFullYear()}${(
      convertedDate.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}${(convertedDate.getDate() - 1)
      .toString()
      .padStart(2, "0")}`;
    const url = `https://web.archive.org/web/${waybackDate}000000im_/${capture.url}`;
    assets = await detectAssets(
      [url],
      new URL(url).pathname,
      /\/assets\/[\w\.]*[0-9a-f]+\.\w+/g,
      capture.firstCapture
    );
    await start(assets, waybackDate, capture.firstCapture);
    fs.writeFileSync(
      path.join(rootFolder, "out", globalThis.date, "metadata.json"),
      JSON.stringify({
        build_number: globalThis.buildNumber ?? null,
        release_channel: "stable",
      })
    );
  }
} else {
  const url = pathToFileURL(path.join(rootFolder, "input", "index.html"));
  assets = await detectAssets(
    [url.toString()],
    url.pathname,
    /\/assets\/[\w\.]*[0-9a-f]+\.\w+/g
  );
  await start(assets);
  fs.writeFileSync(
    path.join(rootFolder, "out", "metadata.json"),
    JSON.stringify({
      build_number: globalThis.buildNumber ?? null,
      release_channel: "stable",
    })
  );
}
