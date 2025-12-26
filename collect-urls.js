const urls = [
  "https://www.dvdplaza.fi/search/blah",
];

const anchorLinks = document
  .querySelector(".searchResultsList")
  .querySelectorAll(".listBlock .title a");

const hrefs = [];

for (const anchorLink of anchorLinks) {
  hrefs.push(anchorLink.href);
}
