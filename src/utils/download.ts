import fs from "node:fs";
import path from "node:path";

import { Readable } from "node:stream";
import { finished } from "node:stream/promises";
import { ReadableStream } from "node:stream/web";

const fetchOptions: RequestInit = {
  cache: "no-cache",
  mode: "cors",
  keepalive: true,
  referrer: "https://discord.com",
};

const rootFolder = path.join(import.meta.dirname, "..", "..");

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

  if (regex) {
    return body.matchAll(regex);
  }
}

export async function fetchAssets(
  pathname: string,
  url: string,
  date?: string
) {
  const res = await (async function fetchRetry(): Promise<any> {
    async function retry(err: any) {
      if (err.code !== "ECONNREFUSED") {
        console.error(err)
      } else {
        console.log("Wayback Machine connection got refused...")
      }
      await timer(5000);
      return await fetchRetry();
    }
    return fetch(
      url,
      url.includes("discord.com") ? fetchOptions : undefined
    ).catch(retry);
  })();

  if (!res.ok) {
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
