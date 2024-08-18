import path from "path";
import puppeteer from "puppeteer";
import * as fs from "fs";

const indexHtmlScrapeLinks = [
  {
    2015: "https://web.archive.org/web/*/http://discordapp.com/invite/*",
    2020: "https://web.archive.org/web/*/discord.com/app",
  },
  {
    2015: "https://web.archive.org/web/*/https://ptb.discordapp.com/channels/*",
    2020: "https://web.archive.org/web/*/https://ptb.discord.com/channels/*",
  },
  {
    2015: "https://web.archive.org/web/*/https://canary.discordapp.com/channels/*",
    2020: "https://web.archive.org/web/*/https://canary.discord.com/channels/*",
  },
];

const rootFolder = path.join(import.meta.dirname, "..");
const scrapeFile = path.join(rootFolder, "scrape.txt");

if (!fs.existsSync(scrapeFile)) {
  fs.writeFileSync(scrapeFile, JSON.stringify([]));
}

let finalUrls: any[] = JSON.parse(
  fs.readFileSync(scrapeFile, { encoding: "utf-8" })
);

const browser = await puppeteer.launch({
  headless: false,
  defaultViewport: null,
});
const page = await browser.newPage();

let release_channel = 0;

if (process.argv[2]) {
  switch (true) {
    case process.argv[2].toLocaleLowerCase() == "ptb": {
      release_channel = 1;
      break;
    }
    case process.argv[2].toLocaleLowerCase() == "canary": {
      release_channel = 2;
    }
  }
}

await page.goto(indexHtmlScrapeLinks[release_channel][2015], {
  waitUntil: "domcontentloaded",
});

await page.locator("#resultsUrl.table").wait();
await page.waitForSelector("#resultsUrl_loading", {
  hidden: true,
  timeout: 300000,
});

await page.locator(".dateFrom.sorting").click();

let done2015 = false;

const timer = (ms: number) => new Promise((res) => setTimeout(res, ms));

for (let dataDtIdx = 0; !done2015; dataDtIdx++) {
  const urlList = await page.$$("#resultsUrl tbody tr");

  let urls = [];

  for (const row of urlList) {
    const url = await page.evaluate(
      (element) => element.querySelector(".url")?.textContent,
      row
    );
    const firstCapture = await page.evaluate(
      (element) => element.querySelector(".dateFrom")?.textContent,
      row
    );
    if (firstCapture && Date.parse(firstCapture) >= 1588608000000) {
      done2015 = true;
    }
    if (
      url?.match(/https*:\/\/(?:[www.]|[ptb.]|[canary.])*discord[app]*.com[:80]*\/invite\/\w+/) &&
      !url?.match(/\/invite\/(?:\w+\/[\w\.]+|\w+\?\w+|[\w-]+\.\w+)/) &&
      firstCapture &&
      !(Date.parse(firstCapture) >= 1588608000000)
    ) {
      urls.push({ url, firstCapture });
    }
  }

  // for removing first capture duplicates
  const mappedUrls = new Map(urls.map((url: any) => [url?.firstCapture, url]));

  fs.writeFileSync(
    scrapeFile,
    JSON.stringify([...finalUrls, ...mappedUrls.values()]), {encoding: "utf-8"}
  );
  finalUrls = JSON.parse(fs.readFileSync(scrapeFile, { encoding: "utf-8" }));
  await timer(10000);
  await page.locator(`.paginate_button [data-dt-idx="${dataDtIdx}"]`).click();
}

browser.close();
