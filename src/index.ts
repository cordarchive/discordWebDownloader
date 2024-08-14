import path from "path";
import { URL } from "url";

import { parseJS } from "@discordWebDownloader/utils/parseJS.js";
import {
  detectAssets,
  fetchAssets,
} from "@discordWebDownloader/utils/download.js";

export async function loopMatchingAssets(assets: any[], depth: number) {
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
      const url = new URL(asset, "https://canary.discord.com");
      switch (path.extname(asset)) {
        case ".js": {
          await parseJS(asset, depth);
          break;
        }
        case ".css": {
          const assets = await detectAssets(
            url,
            /\/assets\/[0-9a-f]+\.(?:png|woff2|svg)/g
          );
          if (assets) await loopMatchingAssets([...assets], depth);
          break;
        }
        default: {
          await fetchAssets(asset, url);
          break;
        }
      }
    }
  }
}

globalThis.depth2Assets = [];
globalThis.depth3Assets = [];

const assets = await detectAssets(
  new URL("https://canary.discord.com/app"),
  /\/assets\/[0-9a-f\.]+\.(?:js|css|png|ico)/g
);

if (assets) await loopMatchingAssets([...assets], 1);
if (globalThis.depth2Assets.length != 0)
  await loopMatchingAssets(globalThis.depth2Assets, 2);
if (globalThis.depth3Assets.length != 0)
  await loopMatchingAssets(globalThis.depth3Assets, 3);
