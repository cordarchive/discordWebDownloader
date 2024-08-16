import fs from "node:fs";
import path from "node:path";

import { Readable } from "node:stream";
import { finished } from "node:stream/promises";
import { ReadableStream } from "node:stream/web";

const fetchOptions: RequestInit = {
  cache: "no-cache",
  referrer: "https://discord.com",
  mode: "cors",
  keepalive: true,
};

const rootFolder = path.join(import.meta.dirname, "..", "..");

export async function detectAssets(url: URL, assetPathname: string, regex?: RegExp, date?: string) {
  let pathname = "";

  if (path.extname(url.href) === "") {
    pathname = "index.html";
  } else {
    pathname = assetPathname;
  }

  const finished = await fetchAssets(pathname, url, date);

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

export async function fetchAssets(pathname: string, url: URL, date?: string) {
  const res = await fetch(url, fetchOptions);

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
