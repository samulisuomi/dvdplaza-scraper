async function getAndParseSearchPage(url) {
  const response = await fetch(url, {
    method: "GET",
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch page: ${response.status} ${response.statusText}`
    );
  }

  const html = await response.text();

  const postUrls = findPostUrls(html);
  const nextPage = findNextPage(html);

  return {
    postUrls,
    nextPage,
  };
}

function findPostUrls(html) {
  // Pattern to match: <h3 class="title"><a href="posts/1434171/">...
  // Using regex to find all matches
  const regex = /<h3 class="title"><a href="([^"]+)">/g;
  const urls = [];
  let match;

  while ((match = regex.exec(html)) !== null) {
    const path = match[1];
    if (!path.startsWith("posts/")) {
      continue;
    }
    urls.push(`https://www.dvdplaza.fi/${path}`);
  }

  return urls;
}

function findNextPage(html) {
  const nextPageRegex = /<a href="([^"]+)" class="text">Seuraava &gt;<\/a>/g;
  const nextPagePath = nextPageRegex.exec(html)?.[1];

  if (!nextPagePath) {
    // TODO: FIND
    const olderMessagesRegex =
      /<a href="([^"]+)">Etsi vanhempia viestejä<\/a>/g;
    const olderMessagesPath = olderMessagesRegex.exec(html)?.[1];

    if (!olderMessagesPath) {
      console.warn(
        "Could not find neither next page path nor older messages path"
      );
      return {
        getSearchUrlNextArgs: null,
        nextPageUrl: null,
      };
    }

    const decodedPath = olderMessagesPath.replace(/&amp;/g, "&");
    const fullUrl = new URL(decodedPath, "https://www.dvdplaza.fi");
    const params = new URLSearchParams(fullUrl.search);
    const userId = params.get("user_id");
    const before = params.get("before");
    if (!userId) {
      console.warn("Falsy user_id param", userId);
    }
    if (!before) {
      console.warn("Falsy before param", before);
    }

    return {
      getSearchUrlNextArgs: {
        userId,
        before,
      },
      nextPageUrl: null,
    };
  }

  return {
    getSearchUrlNextArgs: null,
    nextPageUrl: `https://www.dvdplaza.fi/${nextPagePath}`,
  };
}

// If run directly, execute with parameters from CLI
if (require.main === module) {
  const url = process.argv[2];
  (async () => {
    try {
      if (!url) {
        console.error("Error: URL parameter is required");
        process.exit(1);
      }
      const searchPageData = await getAndParseSearchPage(url);
      console.log(JSON.stringify(searchPageData, undefined, 2));
      process.exit(0);
    } catch (error) {
      console.error("Error:", error.message);
      process.exit(1);
    }
  })();
}

module.exports = getAndParseSearchPage;
