import path from "path";
import { URL, pathToFileURL } from "url";
import * as fs from "fs";

import { parseJS } from "@discordWebDownloader/utils/parseJS.js";
import {
  detectAssets,
  fetchAssets,
} from "@discordWebDownloader/utils/download.js";

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
      console.log(`[index] Downloading: ${asset}`);
      let url = new URL(asset, "https://discord.com");
      if ((await fetch(url)).status !== 200) {
        url = new URL(
          `https://web.archive.org/web/${waybackDate}000000im_/https://discordapp.com/${asset}`
        );
      }
      switch (path.extname(asset)) {
        case ".js": {
          await parseJS(asset, depth, waybackDate);
          break;
        }
        case ".css": {
          const assets = await detectAssets(
            url,
            asset,
            /\/assets\/[\w\.]*[0-9a-f]+\.\w+/g,
            date
          );
          if (assets)
            await loopMatchingAssets([...assets], depth, waybackDate, date);
          break;
        }
        default: {
          await fetchAssets(asset, url, date);
          break;
        }
      }
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

if (!process.argv[2] || process.argv[2] === "false") {
  const captures = JSON.parse(
    fs.readFileSync(scrapeFile, {
      encoding: "utf-8",
    })
  );

  for (const capture of captures) {
    globalThis.date = capture.firstCapture;
    const convertedDate = new Date(Date.parse(capture.firstCapture));
    const waybackDate = `${convertedDate.getFullYear()}${(
      convertedDate.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}${(convertedDate.getDate() - 1)
      .toString()
      .padStart(2, "0")}`;
    const link = `https://web.archive.org/web/${waybackDate}000000im_/https://discordapp.com/invite/${
      capture.url.match(/\w+\:\/\/[\w\.]+\/(\w+)/)[1]
    }`;
    const url = new URL(link);
    assets = await detectAssets(
      url,
      url.pathname,
      /\/assets\/[\w\.]*[0-9a-f]+\.\w+/g,
      capture.firstCapture
    );
    await start(assets, waybackDate, capture.firstCapture);
    fs.writeFileSync(
      path.join(rootFolder, "out", globalThis.date, "metadata.json"),
      JSON.stringify({ buildNumber: globalThis.buildNumber })
    );
  }
} else {
  const url = pathToFileURL(path.join(rootFolder, "input", "index.html"));
  assets = await detectAssets(
    url,
    url.pathname,
    /\/assets\/[\w\.]*[0-9a-f]+\.\w+/g
  );
  await start(assets);
  fs.writeFileSync(
    path.join(rootFolder, "out", "metadata.json"),
    JSON.stringify({ buildNumber: globalThis.buildNumber })
  );
}
