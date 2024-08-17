export function determineDownloadUrlOrder(
  asset: any,
  waybackDate: any,
  date: any
) {
  switch (true) {
    case date.includes("2015"): {
      return [
        `https://web.archive.org/web/${waybackDate}000000im_/https://d3dsisomax34re.cloudfront.net${asset}`,
        `https://web.archive.org/web/${waybackDate}000000im_/https://discordapp.com${asset}`,
        `https://discord.com${asset}`,
      ];
    }
    case date.includes("2016"):
    case date.includes("2017"): {
      return [
        `https://web.archive.org/web/${waybackDate}000000im_/https://discordapp.com${asset}`,
        `https://discord.com${asset}`,
      ];
    }
    default: {
      return [
        `https://discord.com${asset}`,
        `https://web.archive.org/web/${waybackDate}000000im_/https://discord.com${asset}`,
        `https://web.archive.org/web/${waybackDate}000000im_/https://discordapp.com${asset}`,
        `https://web.archive.org/web/${waybackDate}000000im_/https://d3dsisomax34re.cloudfront.net${asset}`,
      ];
    }
  }
}
