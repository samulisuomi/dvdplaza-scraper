function getSearchUrlNext(userId, before) {
  const params = new URLSearchParams({
    user_id: userId,
    before,
  });

  const url = `https://www.dvdplaza.fi/search/member?${params.toString()}`;

  return fetch(url, {
    method: "GET",
    redirect: "manual",
  }).then((res) => {
    const location = res.headers.get("location");
    if (location) {
      return location;
    } else {
      throw new Error("No Location header found in response");
    }
  });
}

// If run directly, execute with parameters from CLI
if (require.main === module) {
  const userId = process.argv[2];
  const before = process.argv[3];
  getSearchUrlNext(userId, before)
    .then((location) => {
      console.log(location);
      process.exit(0);
    })
    .catch((error) => {
      console.error("Error:", error.message);
      process.exit(1);
    });
}

module.exports = getSearchUrlNext;
