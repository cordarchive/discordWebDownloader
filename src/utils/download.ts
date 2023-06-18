import fs from "node:fs";
import path from "node:path";

import { Readable } from "node:stream";
import { finished } from "node:stream/promises";
import { ReadableStream } from "node:stream/web";

const fetchOptions: RequestInit = {
  cache: "no-cache",
  referrer: "https://canary.discord.com",
  mode: "cors",
  keepalive: true,
};

export async function detectAssets(url: URL, regex?: RegExp) {
  let pathname = "";

  if (path.extname(url.href) === "") {
    pathname = "index.html";
  } else {
    pathname = url.pathname;
  }

  const finished = await fetchAssets(pathname, url);

  if (!finished) {
    return;
  }

  const body = fs.readFileSync(path.join(process.cwd(), "out", pathname), {
    encoding: "utf-8",
    flag: "rs+",
  });

  if (regex) {
    return body.matchAll(regex);
  }
}

export async function fetchAssets(pathname: string, url: URL) {
  const res = await fetch(url, fetchOptions);

  if (!res.ok) {
    return false;
  }

  const file = fs.createWriteStream(path.join(process.cwd(), "out", pathname), {
    encoding: "utf-8",
    flags: "w+",
  });

  if (res.body) {
    const stream = Readable.fromWeb(res.body as ReadableStream<any>);
    await finished(stream.pipe(file));
  }

  return true;
}
