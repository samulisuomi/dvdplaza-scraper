## dvdplaza-scraper

R.I.P. DVDPlaza.fi

A quick and dirty pile of code to scrape your own DVDPlaza.fi posting history before the site shuts down at the end of 2025.

**Will not work after the original servers are gone as this relies on the search functionality of the forum.**

### Prerequisites

0. (Only tested on macOS)
1. Install Node.js 25, e.g. via NVM
2. Install [monolith](https://github.com/Y2Z/monolith), e.g. `brew install monolith`
3. Install deps:
   ```
   npm ci
   ```

### Demo

https://github.com/user-attachments/assets/9b7e5712-412a-41be-b564-9190128dd4a9

Then...

https://github.com/user-attachments/assets/b5c4f63b-044b-4bdc-9ccf-52585cc2f423

### How to scrape

```
npm run scrape "Käyttäjän Nimimerkki Tähän"
```

### How to view the scraped data

```
npm run serve
```

This runs a crude web server on your machine. You can open the link in the browser that's printed on the command line.

> ⓘ By default, the server prints out a directory listing unless the folder has index.html in it. This means the navigation behavior when you open a thread folder is different if you had a post on the first page on the thread vs only on later pages. The user experience is a bit better on the latter case, because the server will list all the available page folders, while in the former case you have to do guesswork by clicking on the DVDPlaza UI that opens up (or peek into the `output` directory in your file explorer).

### How to backup the data

Create a .zip file out of the contents of `./output`. Store the .zip somewhere, for example Dropbox, Google Drive or iCloud.

> ⓘ Note that the contents of `./output` are gitignored so it can easily get lost otherwise.

You can also back up `.scraper-lock.json` – it contains metadata you might be interested in the future, like the list of all your post URLs.

### How to view the backed up data

Put the contents of `./output` onto a web server. E.g. clone this repo on another computer, extract the .zip into `./output` and run `npm run serve`.
