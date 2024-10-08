/*  import { parentPort, workerData } from "worker_threads";

    parentPort?.postMessage(downloadJS(workerData.asset))

*/

import { detectAssets } from "@discordWebDownloader/utils/download.js";
import { flattenRegexArray } from "@discordWebDownloader/utils/flattenRegexArray.js";
import { determineDownloadUrlOrder } from "@discordWebDownloader/utils/determineDownloadUrlOrder.js";

const getChunkAssets =
  /(?<![g-zA-Z_])([0-9a-f]+): ?"([0-9a-f]{8,})",?(?![g-zA-Z_])/g;

const getMediaAssets = /"([0-9a-f]{8,}\.(?:worker\.)?\w+)"/g;

const getBuildNumber = /(?:appVersion|buildNumber|build_number|release)(?::|=)"(\d+)"/g;

const getChannel = /(?:environment|releaseStage|releaseChannel)(?::|=)"(\w+)"/g;

/*  TODO: Allowing people to control how precise the search the latter part will be. Default will be 2^3
    This regex should match 7e3:"e893f6ba921a0c8b" and 7e3: "e893f6ba921a0c8b" but not id:"2391042821491529"
    Result should return only one file matching with a lot of assets which fill be formated to 7e3.e893f6ba921a0c8b.js for every iteration
*/

export async function parseJS(asset: string, waybackDate?: string) {
  const urls = determineDownloadUrlOrder(asset, waybackDate, date);

  const buildNumberCheckResult = await detectAssets(
    urls,
    asset,
    getBuildNumber,
    date
  );

  const channelCheckResult = await detectAssets(
    urls,
    asset,
    getChannel,
    date
  );

  if (buildNumberCheckResult) {
    const result = Array.from(buildNumberCheckResult);
    if (result.length !== 0) {
      globalThis.buildNumber = result[0][1];
    }
  }

  if (channelCheckResult) {
    const result = Array.from(channelCheckResult);
    if (result.length !== 0) {
      globalThis.channel = result[0][1];
    }
  }

  const chunkAssets = await detectAssets(urls, asset, getChunkAssets, date);
  const mediaAssets = await detectAssets(urls, asset, getMediaAssets, date);
  if (chunkAssets) {
    globalThis.assetsToDownload.push([...new Set(flattenRegexArray(Array.from(chunkAssets)))]);
  }
  if (mediaAssets) {
    globalThis.assetsToDownload.push([...new Set(flattenRegexArray(Array.from(mediaAssets)))]);
  }
}
