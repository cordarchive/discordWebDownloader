import path from "path";
import { URL, pathToFileURL } from "url";
import * as fs from "fs";

import { parseJS } from "@discordWebDownloader/utils/parseJS.js";
import {
  detectAssets,
  fetchAssets,
} from "@discordWebDownloader/utils/download.js";

const timer = (ms: number) => new Promise((res) => setTimeout(res, ms));

export async function loopMatchingAssets(
  assets: any[],
  depth: number,
  waybackDate?: string,
  date?: string
) {
  if (assets) {
    assets.forEach((element, index, array) => {
      if (element[1]) {
        switch (depth) {
          case 2: {
            array[index] = [
              `/assets/${element[1]}.${element[2]}.js`,
              `/assets/${element[2]}.js`,
            ];
            break;
          }
          case 3: {
            array[index] = `/assets/${element[1]}`;
            break;
          }
        }
      }
    });
    assets = assets.flat(Infinity);
    for (const asset of assets) {
      const outputPath = date
        ? path.join(rootFolder, "out", date, asset)
        : path.join(rootFolder, "out", asset);
      if (fs.existsSync(outputPath)) {
        continue;
      }
      console.log(`[index] Downloading: ${asset}`);
      let urls = [
        `https://discord.com${asset}`,
        `https://web.archive.org/web/${waybackDate}000000im_/https://discordapp.com${asset}`,
        `https://web.archive.org/web/${waybackDate}000000im_/https://d3dsisomax34re.cloudfront.net${asset}`,
      ];
      switch (path.extname(asset)) {
        case ".js": {
          await parseJS(asset, depth, waybackDate);
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
            await loopMatchingAssets([...assets], depth, waybackDate, date);
          break;
        }
        default: {
          let finished;
          for (const url of urls) {
            if (!finished) {
              finished = await fetchAssets(asset, url, date);
            } else {
              break;
            }
          }
          break;
        }
      }
      await timer(3000);
    }
  }
}

globalThis.depth2Assets = [];
globalThis.depth3Assets = [];

let assets;

const rootFolder = path.join(import.meta.dirname, "..");
const scrapeFile = path.join(rootFolder, "scrape.txt");

async function start(assets: any, waybackDate?: string, date?: string) {
  if (assets) await loopMatchingAssets([...assets], 1, waybackDate, date);
  if (globalThis.depth2Assets.length != 0)
    await loopMatchingAssets(globalThis.depth2Assets, 2, waybackDate, date);
  if (globalThis.depth3Assets.length != 0)
    await loopMatchingAssets(globalThis.depth3Assets, 3, waybackDate, date);
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
    globalThis.depth2Assets = [];
    globalThis.depth3Assets = [];
    const convertedDate = new Date(Date.parse(capture.firstCapture));
    const waybackDate = `${convertedDate.getFullYear()}${(
      convertedDate.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}${(convertedDate.getDate() - 1)
      .toString()
      .padStart(2, "0")}`;
    const url = `https://web.archive.org/web/${waybackDate}000000im_/https://discordapp.com/invite/${
      capture.url.match(/\w+\:\/\/[\w\.]+\/(\w+)/)[1]
    }`;
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
