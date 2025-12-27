async function getSearchUrlNext(userId, before) {
  const params = new URLSearchParams({
    user_id: userId,
    before,
  });

  const url = `https://www.dvdplaza.fi/search/member?${params.toString()}`;

  const res = await fetch(url, {
    method: "GET",
    redirect: "manual",
  });

  const location = res.headers.get("location");
  if (location) {
    return location;
  } else {
    // Check if the response indicates no search results
    const html = await res.text();
    if (html.includes("Ei hakutuloksia.")) {
      console.log("The previous search page was the last page, this search returned nothing. All good!")
      return null;
    }
    throw new Error("No Location header found in response");
  }
}

// If run directly, execute with parameters from CLI
if (require.main === module) {
  (async () => {
    const userId = process.argv[2];
    const before = process.argv[3];
    try {
      const location = await getSearchUrlNext(userId, before);
      console.log(location);
      process.exit(0);
    } catch (error) {
      console.error("Error:", error.message);
      process.exit(1);
    }
  })();
}

module.exports = getSearchUrlNext;
