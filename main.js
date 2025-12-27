const fs = require("fs").promises;
const path = require("path");
const { spawn } = require("child_process");

const getSearchUrl = require("./get-search-url-initial.js");
const getSearchUrlNext = require("./get-search-url-next.js");
const getAndParseSearchPage = require("./get-and-parse-search-page.js");
const postUrlToThreadPageUrl = require("./post-url-to-thread-page-url.js");

const LOCK_FILE = ".scraper-lock.json";
const SLEEP_MS = parseInt(process.env.SLEEP_MS || "500", 10);
const MAX_CONCURRENT_DOWNLOADS = 5;

// Sleep utility
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Load lock file
async function loadLock() {
  try {
    const data = await fs.readFile(LOCK_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    if (error.code === "ENOENT") {
      return {
        postUrls: [],
        threadUrls: [],
        downloadedUrls: [],
        currentSearchUrl: null,
      };
    }
    throw error;
  }
}

// Save lock file
async function saveLock(lockData) {
  await fs.writeFile(LOCK_FILE, JSON.stringify(lockData, null, 2), "utf8");
}

// Execute download.sh for a URL
function downloadUrl(url) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, "download.sh");
    const child = spawn("sh", [scriptPath, url], {
      stdio: "inherit",
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`download.sh exited with code ${code}`));
      }
    });

    child.on("error", (error) => {
      reject(error);
    });
  });
}

// Process downloads with concurrency limit
async function processDownloadsWithLimit(urls, maxConcurrent) {
  const results = [];
  const inProgress = new Set();

  for (const url of urls) {
    // Wait until we have a free slot
    while (inProgress.size >= maxConcurrent) {
      await Promise.race(Array.from(inProgress));
    }

    const promise = downloadUrl(url)
      .then(() => {
        inProgress.delete(promise);
        return { url, success: true };
      })
      .catch((error) => {
        inProgress.delete(promise);
        return { url, success: false, error: error.message };
      });

    inProgress.add(promise);
    results.push(promise);
  }

  // Wait for all remaining downloads
  await Promise.all(Array.from(inProgress));
  return Promise.all(results);
}

async function main() {
  const userName = process.argv[2];

  if (!userName) {
    console.error("Usage: node main.js <userName>");
    process.exit(1);
  }

  console.log(`Starting scraper for user: ${userName}`);
  console.log(`Sleep between fetches: ${SLEEP_MS}ms`);

  let lock = await loadLock();
  console.log(
    `Loaded lock file. Found ${lock.postUrls.length} postUrls, ${lock.threadUrls.length} threadUrls`
  );

  try {
    // Step 1: Get initial search URL (if not already in lock)
    let currentSearchUrl = lock.currentSearchUrl;
    if (!currentSearchUrl) {
      console.log("Getting initial search URL...");
      currentSearchUrl = await getSearchUrl(userName);
      await sleep(SLEEP_MS);
      lock.currentSearchUrl = currentSearchUrl;
      await saveLock(lock);
      console.log(`Initial search URL: ${currentSearchUrl}`);
    } else {
      console.log(`Resuming with search URL: ${currentSearchUrl}`);
    }

    // Helper function to convert postUrls to threadUrls
    async function convertPostUrlsToThreadUrls() {
      const postUrlsToProcess = lock.postUrls.filter(
        (postUrl) => !lock.threadUrls.some((t) => t.postUrl === postUrl)
      );

      if (postUrlsToProcess.length === 0) {
        return;
      }

      console.log(
        `\nConverting ${postUrlsToProcess.length} postUrls to threadUrls...`
      );

      for (let i = 0; i < postUrlsToProcess.length; i++) {
        const postUrl = postUrlsToProcess[i];
        console.log(
          `[${i + 1}/${postUrlsToProcess.length}] Looking up thread URL of: ${postUrl}`
        );
        try {
          const threadUrl = await postUrlToThreadPageUrl(postUrl);
          lock.threadUrls.push({ postUrl, threadUrl });
          await saveLock(lock);
          await sleep(SLEEP_MS);
        } catch (error) {
          console.error(`Error converting ${postUrl}: ${error.message}`);
          // Continue with next URL
        }
      }
    }

    // Step 2-4: Get and parse search pages until done
    while (currentSearchUrl) {
      console.log(`Fetching and parsing search page: ${currentSearchUrl}`);
      const searchPageData = await getAndParseSearchPage(currentSearchUrl);
      await sleep(SLEEP_MS);

      // Add new postUrls to the collection
      const newPostUrls = searchPageData.postUrls.filter(
        (url) => !lock.postUrls.includes(url)
      );
      lock.postUrls.push(...newPostUrls);
      console.log(
        `Found ${searchPageData.postUrls.length} postUrls (${newPostUrls.length} new)`
      );

      // Determine next page
      let nextSearchUrl = null;
      if (searchPageData.nextPage.nextPageUrl) {
        // Regular pagination - continue to next page
        nextSearchUrl = searchPageData.nextPage.nextPageUrl;
      } else if (searchPageData.nextPage.getSearchUrlNextArgs) {
        // Step 5: When we hit a page that requires getSearchUrlNext,
        // convert all postUrls to threadUrls first before continuing
        const { userId, before } = searchPageData.nextPage.getSearchUrlNextArgs;
        if (userId && before) {
          await convertPostUrlsToThreadUrls();
          
          console.log(
            `Getting next search URL with userId=${userId}, before=${before}`
          );
          nextSearchUrl = await getSearchUrlNext(userId, before);
          await sleep(SLEEP_MS);
        } else {
          console.log(
            "No valid getSearchUrlNextArgs, stopping search page collection"
          );
          break;
        }
      } else {
        // No next page - convert remaining postUrls and stop
        console.log("No next page found, stopping search page collection");
        await convertPostUrlsToThreadUrls();
        break;
      }

      currentSearchUrl = nextSearchUrl;
      lock.currentSearchUrl = currentSearchUrl;
      await saveLock(lock);
    }

    // Clear currentSearchUrl since we're done with search pages
    lock.currentSearchUrl = null;
    await saveLock(lock);

    // Step 6: Deduplicate threadUrls and download
    const uniqueThreadUrls = [
      ...new Set(lock.threadUrls.map((t) => t.threadUrl)),
    ];
    console.log(`\nFound ${uniqueThreadUrls.length} unique thread URLs`);

    const urlsToDownload = uniqueThreadUrls.filter(
      (url) => !lock.downloadedUrls.includes(url)
    );
    console.log(
      `Downloading ${urlsToDownload.length} URLs (max ${MAX_CONCURRENT_DOWNLOADS} concurrent)...`
    );

    const downloadResults = await processDownloadsWithLimit(
      urlsToDownload,
      MAX_CONCURRENT_DOWNLOADS
    );

    // Update downloaded URLs in lock file
    for (const result of downloadResults) {
      if (result.success) {
        lock.downloadedUrls.push(result.url);
      } else {
        console.error(`Failed to download ${result.url}: ${result.error}`);
      }
    }
    await saveLock(lock);

    console.log(`\nCompleted! Downloaded ${lock.downloadedUrls.length} URLs`);
  } catch (error) {
    console.error("Error:", error.message);
    await saveLock(lock); // Save lock even on error for resuming
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = main;
