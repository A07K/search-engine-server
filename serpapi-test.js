const SerpApi = require("serpapi");
console.log("SerpApi structure:", SerpApi); // Log the structure of SerpApi

const search = new SerpApi.Search({
  api_key: "YOUR_GOOGLE_SCHOLAR_API_KEY",
  engine: "google_scholar",
  q: "cnfet",
});

search.json((data) => {
  console.log("Google Scholar Results:", data);
});
