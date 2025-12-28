## dvdplaza-scraper

### Prerequisites

1. macOS
2. Install Node.js 25, e.g. via NVM
3. Install monolith, e.g. `brew install monolith`
4. Install deps:
   ```
   npm ci
   ```

### Demo

### How to scrape

```
npm run scrape "Käyttäjän Nimimerkki Tähän"
```

### How to view the scraped data

```
npm run serve
```

This runs a crude web server on your machine. You can open the link in the browser that's printed on the command line.

> ⚠️ By default, the server prints out a listing of all files inside the output. Do note the behavior is different if you had a post on the first page on the thread vs not. The user experience is a bit better on the latter case, because the server will list all the available pages, while in the former case you have to keep clicking on the DVDPlaza UI, or peek into the `output` directory in your file explorer.

### How to backup the data

Create a .zip file out of the contents of `./output`.

Note that `./output` is gitignored so it can easily get lost otherwise.

You can also back up `.scraper-lock.json` – it contains metadata you might be interested in the future, like the list of all your post URLs.

### How to view backed up data

Put the contents of `./output` onto a web server. E.g. clone this repo on another computer, extract the .zip into `./output` and run `npm run serve`.
