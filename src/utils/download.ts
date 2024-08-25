import fs from "node:fs";
import path from "node:path";
import readLastLines from "read-last-lines";

import { Readable } from "node:stream";
import { finished } from "node:stream/promises";
import { ReadableStream } from "node:stream/web";
import { convertDateToWaybackDate } from "./convertDateToWaybackDate.js";
import { determineDownloadUrlOrder } from "./determineDownloadUrlOrder.js";

const fetchOptions: RequestInit = {
  cache: "no-cache",
  mode: "cors",
  keepalive: true,
  referrer: "https://discord.com",
};

const rootFolder = path.join(import.meta.dirname, "..", "..");
const buildLogFile = path.join(rootFolder, "build.log");

const timer = (ms: number) => new Promise((res) => setTimeout(res, ms));

export async function detectAssets(
  urls: string[],
  assetPathname: string,
  regex?: RegExp,
  date?: string
) {
  let pathname = "";

  if (path.extname(urls[0]) === "") {
    pathname = "index.html";
  } else {
    pathname = assetPathname;
  }

  let finished = false;

  for (const url of urls) {
    if (!finished) {
      finished = await fetchAssets(pathname, url, date);
    } else {
      break;
    }
  }

  if (!finished) {
    return;
  }

  const outPath = date
    ? path.join(rootFolder, "out", date, pathname)
    : path.join(rootFolder, "out", pathname);

  const body = fs.readFileSync(outPath, {
    encoding: "utf-8",
    flag: "rs+",
  });

  const lastIndexFolder = await readLastLines.read(buildLogFile, 1, "utf-8");

  if (lastIndexFolder !== "") {
    const lastIndex = fs.readFileSync(
      path.join(rootFolder, "out", lastIndexFolder, "index.html"),
      {
        encoding: "utf-8",
      }
    );
  
    if (pathname === "index.html" && lastIndex === body) {
      return;
    }
  }

  if (regex) {
    return body.matchAll(regex);
  }
}

async function fetchRetry(url: any): Promise<any> {
  async function retry() {
    await timer(5000);
    return await fetchRetry(url);
  }
  return fetch(
    url,
    url.includes("discord.com") ? fetchOptions : undefined
  ).catch(retry);
}

export async function fetchAssets(
  pathname: string,
  url: string,
  date?: string
) {
  let res = await fetchRetry(url);
  let daysBefore = 0;

  while (res.status === 429 || res.status === 500) {
    await timer(5000);
    daysBefore = daysBefore + 7;
    const newUrls = determineDownloadUrlOrder(pathname, convertDateToWaybackDate(date, daysBefore), date)
    for (const url of newUrls) {
      res = await fetchRetry(url);
    }
  }

  if (!res.ok) {
    if (res.status >= 400 && res.status !== 404 && res.status !== 429 && res.status !== 500) {
      throw Error(`[index] Error while fetching: ${res.status}`);
    }
    return false;
  }

  const outPath = date
    ? path.join(rootFolder, "out", date)
    : path.join(rootFolder, "out");

  if (!fs.existsSync(path.join(rootFolder, "out"))) {
    fs.mkdirSync(path.join(rootFolder, "out"));
  }

  if (!fs.existsSync(outPath)) {
    fs.mkdirSync(outPath);
  }

  if (!fs.existsSync(path.join(outPath, "assets"))) {
    fs.mkdirSync(path.join(outPath, "assets"));
  }

  const file = fs.createWriteStream(path.join(outPath, pathname), {
    encoding: "utf-8",
    flags: "w+",
  });

  if (res.body) {
    const stream = Readable.fromWeb(res.body as ReadableStream<any>);
    await finished(stream.pipe(file));
  }

  return true;
}
