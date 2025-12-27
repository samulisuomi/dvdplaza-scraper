async function postUrlToThreadPageUrl(postUrl, keepFragment = false) {
  const response = await fetch(postUrl, {
    method: "GET",
    redirect: "manual",
  });

  const location = response.headers.get("location");

  if (location) {
    if (!keepFragment) {
      const url = new URL(location);
      url.hash = "";
      return url.toString();
    }
    return location;
  } else {
    throw new Error("No Location header found in response");
  }
}

// If run directly, execute with parameters from CLI
if (require.main === module) {
  const postUrl = process.argv[2];
  const keepFragment = process.argv[3] === "--keep-fragment";
  (async () => {
    try {
      const location = await postUrlToThreadPageUrl(postUrl, keepFragment);
      console.log(location);
      process.exit(0);
    } catch (error) {
      console.error("Error:", error.message);
      process.exit(1);
    }
  })();
}

module.exports = postUrlToThreadPageUrl;
