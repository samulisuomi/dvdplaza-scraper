async function getSearchUrl(userName) {
  const data = new URLSearchParams({
    users: userName,
  });

  const response = await fetch("https://www.dvdplaza.fi/search/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: data.toString(),
    redirect: "manual",
  });

  const location = response.headers.get("location");

  if (location) {
    return location;
  } else {
    throw new Error("No Location header found in response");
  }
}

// If run directly, execute with parameters from CLI
if (require.main === module) {
  const userName = process.argv[2];
  (async () => {
    try {
      const location = await getSearchUrl(userName);
      console.log(location);
      process.exit(0);
    } catch (error) {
      console.error("Error:", error.message);
      process.exit(1);
    }
  })();
}

module.exports = getSearchUrl;
