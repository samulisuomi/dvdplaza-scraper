const https = require("https");
const querystring = require("querystring");

function getSearchUrl(userName) {
  return new Promise((resolve, reject) => {
    const data = querystring.stringify({
      users: userName,
    });

    const options = {
      hostname: "www.dvdplaza.fi",
      path: "/search/search",
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Connection: "close",
      },
    };

    const req = https.request(options, (res) => {
      // Node.js normalizes headers to lowercase
      const location = res.headers.location;

      // Consume the response to allow the connection to close
      res.on("data", () => {});
      res.on("end", () => {});

      if (location) {
        resolve(location);
        // Destroy the connection to ensure immediate exit
        res.destroy();
      } else {
        reject(new Error("No Location header found in response"));
      }
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

// If run directly, execute with parameters from CLI
if (require.main === module) {
  const userName = process.argv[2];
  getSearchUrl(userName)
    .then((location) => {
      console.log(location);
      process.exit(0);
    })
    .catch((error) => {
      console.error("Error:", error.message);
      process.exit(1);
    });
}

module.exports = getSearchUrl;
