# Discord Web Downloader

Rewrite of the old Discord-Web-Build-Archiver using Javascript.

Currently WIP, it gets current Canary index.html and downloads the rest i guess. Improvements needed.

TODO:
- Scraping urls from: 
  - `https://web.archive.org/web/*/discord.gg*` (2015-2020)
  - `https://web.archive.org/web/*/discord.com/app` (2020-2024)
  - [Argument switch needed] `https://web.archive.org/web/*/https://ptb.discordapp.com/channels/*` (PTB; 2019-2020)
  - [Argument switch needed] `https://web.archive.org/web/*/https://ptb.discord.com/channels/*` (PTB; 2020-2024)
  - [Argument switch needed] `https://web.archive.org/web/*/https://canary.discordapp.com/channels/*` (Canary; 2019-2020)
  - [Argument switch needed] `https://web.archive.org/web/*/https://canary.discord.com/channels/*` (Canary; 2020-2024)
- Using index.htmls from:
  - Download from `scrape.txt`
  - Imported index.html, one argument switch to enable
- Download assets from:
  - `discord.com/assets`
  - Wayback Machine (useful for v2 clients, aka 2015-2018 ones.)
- Upload to archive.org (api keys in .env file)