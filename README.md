# LaclauGPT 

> **Legacy repository:** This repository is preserved for academic research documentation. Active development continues in [LaclauGPT](https://github.com/TomiToivio/LaclauGPT).

LaclauGPT is a political science multimodal data collection and analysis pipeline. It is called LaclauGPT as a tribute to [Ernesto Laclau](https://en.wikipedia.org/wiki/Ernesto_Laclau).

LaclauGPT is developed by [Tomi Toivio](mailto:tomi.toivio@helsinki.fi) for three [Helsinki Hub on Emotions, Populism and Polarisation](https://www.helsinki.fi/en/researchgroups/emotions-populism-and-polarisation) research projects funded by the European Union and the Research Council of Finland:
* [CO3](https://www.co3socialcontract.eu/) researches the social contract. 
* [ENDURE](https://www.endure-project.org/) researches the world after the pandemic. 
* [PLEDGE](https://www.pledgeproject.eu/) researches grievance politics.

The pipeline was used to collect and analyze multimodal social media data related to the 2024 European parliament elections. Data was collected from TikTok and Instagram. Data collection started in 1st of May 2024 and continued until the election day in 9th of June 2024. Collection was based on usernames of official election candidates as well as hashtags and search queries related to the elections. Election data was collected for Bulgaria, Croatia, Finland, France, Germany, Hungary, Portugal, Spain and Sweden. Collected and analyzed data cannot be released yet due to GDPR. This open source version uses dummy data. 

## LaclauGPT TikTok Scraper

Legacy Firefox + Node.js research scraper from the LaclauGPT project.

> **Status:** this scraper was functional in 2024. TikTok API responses, browser behavior and page structure may have changed since then. Treat this repository as research software and documentation, not as a maintained production scraper. Use it only where your collection is permitted and appropriate for your research context.

## What it does

The scraper has two parts:

- **Firefox extension** (`Firefox/`) that observes TikTok JSON API responses while browsing and extracts video, author, hashtag, challenge and comment metadata.
- **Node.js backend** (`Node/`) that accepts the extracted metadata over a localhost REST API and stores it in SQLite.

The backend listens on `127.0.0.1:3000` by default so the collector is not exposed to the local network.

## Quick start

### 1. Start the backend

```bash
cd Node
npm ci
npm start
```

The SQLite database is written to `Node/tiktok_scraper.db` when the command is run from the `Node` directory. Local SQLite files are ignored by Git.

Optional environment variables:

```bash
HOST=127.0.0.1 PORT=3000 DB_PATH=tiktok_scraper.db npm start
```

### 2. Load the Firefox extension

In Firefox, open `about:debugging`, choose **This Firefox**, select **Load Temporary Add-on**, and open `Firefox/manifest.json`.

The extension is configured to send data to `http://localhost:3000`.

### 3. Configure research targets if you want automated browsing

Edit `SCRAPE_CONFIG` near the top of `Firefox/content.js` and add the search queries, TikTok usernames and hashtags relevant to your study.

The default configuration contains empty lists. With empty lists, automated navigation stays idle; passive collection can still occur while you browse TikTok manually.

## Legacy behavior and limitations

- The TikTok endpoint routing and response-field mappings reflect the API shapes observed during the 2024 collection.
- Duplicate videos, comments, authors, hashtags and challenges are ignored using legacy unique identifiers.
- The backend has no authentication because it is intentionally bound to localhost by default.
- This repository does not include the original EP2024 candidate lists or research data.
- There is no guarantee that current TikTok responses still match the legacy parsers.

## Project background

LaclauGPT is a political science multimodal data collection and analysis pipeline named after Ernesto Laclau. This scraper was used as part of research at the Helsinki Hub on Emotions, Populism and Polarisation, including work around the 2024 European Parliament elections.

The original collection covered TikTok and Instagram material related to election candidates, hashtags and political search queries. Research data is not included in this public repository.

Author: Tomi Toivio  
License: CC0 1.0 Universal


## Development standards

The legacy implementation now has a small modern quality layer around both components.

- Node.js 20+ is declared in `.nvmrc` and `package.json`.
- ESLint checks both the Express backend and Firefox extension JavaScript.
- Prettier checks JavaScript, JSON, and Markdown formatting.
- Mozilla `web-ext lint` validates the Firefox WebExtension manifest and extension files.
- GitHub Actions runs the same checks on pull requests and pushes to `main`.
- Dependabot monitors npm dependencies under `Node/`.
- `.editorconfig` keeps UTF-8, LF line endings, final newlines, and two-space JS/JSON indentation consistent.

From `Node/`, install dependencies and run the complete quality gate:

```bash
npm ci
npm run check
```

These standards intentionally wrap the existing 2024 scraper rather than converting it to TypeScript, Manifest V3, a monorepo framework, or a new application architecture. Those would be functional migrations rather than repository standardization.
