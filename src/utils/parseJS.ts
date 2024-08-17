/*  import { parentPort, workerData } from "worker_threads";

    parentPort?.postMessage(downloadJS(workerData.asset))

*/

import { detectAssets } from "@discordWebDownloader/utils/download.js";
import { flattenRegexArray } from "@discordWebDownloader/utils/flattenRegexArray.js";

const getWebpackAssets =
  /(?<![g-zA-Z_])([0-9a-f]+): ?"([0-9a-f]{8,})",?(?![g-zA-Z_])/g;

const getMediaAssets = /"([0-9a-f]{8,}\.\w+)"/g;

const getBuildNumber = /(?:appVersion|buildNumber).*"(\d+)"/g;

/*  TODO: Allowing people to control how precise the search the latter part will be. Default will be 2^3
    This regex should match 7e3:"e893f6ba921a0c8b" and 7e3: "e893f6ba921a0c8b" but not id:"2391042821491529"
    Result should return only one file matching with a lot of assets which fill be formated to 7e3.e893f6ba921a0c8b.js for every iteration
*/

export async function parseJS(asset: string, waybackDate?: string) {
  let urls = [
    `https://discord.com${asset}`,
    `https://web.archive.org/web/${waybackDate}000000im_/https://discordapp.com${asset}`,
    `https://web.archive.org/web/${waybackDate}000000im_/https://d3dsisomax34re.cloudfront.net${asset}`,
  ];

  const buildNumberCheckResult = await detectAssets(
    urls,
    asset,
    getBuildNumber,
    date
  );

  if (buildNumberCheckResult) {
    globalThis.buildNumber = Array.from(buildNumberCheckResult)[1];
  }

  let assets;

  assets = await detectAssets(urls, asset, getWebpackAssets, date);
  if (assets && Array.from(assets).length === 0) {
    assets = await detectAssets(urls, asset, getMediaAssets, date);
  }
  if (assets) {
    assets = flattenRegexArray(Array.from(assets));
    globalThis.assets.push(assets);
  }
}
