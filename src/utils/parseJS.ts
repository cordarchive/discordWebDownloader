/*  import { parentPort, workerData } from "worker_threads";

    parentPort?.postMessage(downloadJS(workerData.asset))

*/

import { detectAssets } from "@discordWebDownloader/utils/download.js";

const getWebpackAssets =
  /(?<![g-zA-Z_])([0-9a-f]+): ?"([0-9a-f]{8,})",?(?![g-zA-Z_])/g;

const getMediaAssets =
  /"([0-9a-f]{8,}.(?:png|webm|mp3|svg|mp4|gif))"/g;

/*  TODO: Allowing people to control how precise the search the latter part will be. Default will be 2^3
    This regex should match 7e3:"e893f6ba921a0c8b" and 7e3: "e893f6ba921a0c8b" but not id:"2391042821491529"
    Result should return only one file matching with a lot of assets which fill be formated to 7e3.e893f6ba921a0c8b.js for every iteration
*/

export async function parseJS(asset: string, depth: number) {
  const url = new URL(asset, "https://canary.discord.com");

  switch (depth) {
    case 1: {
      const assets = await detectAssets(url, getWebpackAssets);
      if (assets) {
        globalThis.depth2Assets = [...globalThis.depth2Assets, ...assets];
      }
      break;
    }
    case 2: {
      const assets = await detectAssets(url, getMediaAssets);
      if (assets) {
        globalThis.depth3Assets = [...globalThis.depth3Assets, ...assets];
      }
      break;
    }
  }
}
