async function searchPageToPostUrls(url) {
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

  // Pattern to match: <h3 class="title"><a href="posts/1434171/">...
  // Using regex to find all matches
  const regex = /<h3 class="title"><a href="([^"]+)">/g;
  const urls = [];
  let match;

  while ((match = regex.exec(html)) !== null) {
    const path = match[1];
    urls.push(`https://www.dvdplaza.fi/${path}`);
  }

  return urls;
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
      const urls = await searchPageToPostUrls(url);
      urls.forEach((url) => console.log(url));
      process.exit(0);
    } catch (error) {
      console.error("Error:", error.message);
      process.exit(1);
    }
  })();
}

module.exports = searchPageToPostUrls;
