/*  import { parentPort, workerData } from "worker_threads";

    parentPort?.postMessage(downloadJS(workerData.asset))

*/

import { detectAssets } from "@discordWebDownloader/utils/download.js";
import path from "path";

const getWebpackAssets =
  /(?<![g-zA-Z_])([0-9a-f]+): ?"([0-9a-f]{8,})",?(?![g-zA-Z_])/g;

const getMediaAssets = /"([0-9a-f]{8,}\.\w+)"/g;

const getBuildNumber = /(?:appVersion|buildNumber).*"(\d+)"/g;

/*  TODO: Allowing people to control how precise the search the latter part will be. Default will be 2^3
    This regex should match 7e3:"e893f6ba921a0c8b" and 7e3: "e893f6ba921a0c8b" but not id:"2391042821491529"
    Result should return only one file matching with a lot of assets which fill be formated to 7e3.e893f6ba921a0c8b.js for every iteration
*/

export async function parseJS(
  asset: string,
  depth: number,
  waybackDate?: string
) {
  let url = new URL(asset, "https://discord.com");
  if ((await fetch(url)).status !== 200) {
    url = new URL(
      `https://web.archive.org/web/${waybackDate}000000im_/https://discordapp.com/${asset}`
    );
  }

  const buildNumberCheckResult = await detectAssets(url, asset, getBuildNumber);

  if (buildNumberCheckResult) {
    globalThis.buildNumber = Array.from(buildNumberCheckResult)[1];
  }

  let assets;

  switch (depth) {
    case 1: {
      assets =
        (await detectAssets(url, asset, getWebpackAssets, date)) ??
        (await detectAssets(url, asset, getMediaAssets, date));
      if (assets) {
        globalThis.depth2Assets = [...globalThis.depth2Assets, ...assets];
      }
      break;
    }
    case 2: {
      assets = await detectAssets(url, asset, getMediaAssets, date);
      if (assets) {
        globalThis.depth3Assets = [...globalThis.depth3Assets, ...assets];
      }
      break;
    }
  }
}
