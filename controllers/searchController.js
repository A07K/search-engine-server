const axios = require("axios");
const User = require("../models/User");
const SerpApi = require("serpapi");
const GoogleSearch = SerpApi.GoogleSearch;

// YouTube search
const searchYouTube = async (query) => {
  const API_KEY = process.env.YOUTUBE_API_KEY;
  console.log("Starting YouTube search with query:", query);
  console.log("Using YouTube API Key:", API_KEY.substring(0, 5) + "...");

  // First, search for videos
  const searchResponse = await axios.get(
    `https://www.googleapis.com/youtube/v3/search`,
    {
      params: {
        part: "snippet",
        q: query,
        type: "video",
        key: API_KEY,
        maxResults: 15,
      },
    }
  );

  console.log("YouTube Search API Response Status:", searchResponse.status);

  // Extract video IDs
  const videoIds = searchResponse.data.items.map((item) => item.id.videoId);

  // Then, get statistics for these videos
  const statsResponse = await axios.get(
    `https://www.googleapis.com/youtube/v3/videos`,
    {
      params: {
        part: "statistics",
        id: videoIds.join(","),
        key: API_KEY,
      },
    }
  );

  console.log("YouTube Stats API Response Status:", statsResponse.status);

  // Combine search results with statistics
  return searchResponse.data.items.map((item, index) => ({
    type: "video",
    title: item.snippet.title,
    link: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    thumbnail: item.snippet.thumbnails.medium.url,
    description: item.snippet.description,
    views: parseInt(statsResponse.data.items[index].statistics.viewCount) || 0,
    likes: parseInt(statsResponse.data.items[index].statistics.likeCount) || 0,
  }));
};

// Google Custom Search for articles and blogs
const searchGoogle = async (query) => {
  const API_KEY = process.env.GOOGLE_API_KEY;
  const SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID;

  console.log("Starting Google search with query:", query);
  console.log("Using API Key:", API_KEY.substring(0, 5) + "...");
  console.log("Using Search Engine ID:", SEARCH_ENGINE_ID);

  const requestUrl = `https://www.googleapis.com/customsearch/v1?cx=${SEARCH_ENGINE_ID}&q=${encodeURIComponent(
    query
  )}`;
  console.log("Request URL:", requestUrl);

  try {
    const response = await axios.get(
      `https://www.googleapis.com/customsearch/v1`,
      {
        params: {
          key: API_KEY,
          cx: SEARCH_ENGINE_ID,
          q: query,
        },
      }
    );

    console.log("Google API Response Status:", response.status);
    console.log("Google API Response Headers:", response.headers);

    return response.data.items.map((item, index) => ({
      type:
        item.pagemap.metatags[0]["og:type"] === "article" ? "article" : "blog",
      title: item.title,
      link: item.link,
      snippet: item.snippet,
      relevance: 1 - index / response.data.items.length, // Simple relevance score based on order
    }));
  } catch (error) {
    console.error(
      "Error in Google search:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};

// Google Scholar for academic papers
const searchScholar = async (query) => {
  console.log("Starting Google Scholar search with query:", query);

  const params = {
    engine: "google_scholar",
    q: query,
    api_key: process.env.GOOGLE_SCHOLAR_API,
    hl: "en",
  };

  return new Promise((resolve, reject) => {
    SerpApi.getJson(params, (json) => {
      if (json.organic_results) {
        console.log(
          `Google Scholar found ${json.organic_results.length} results`
        );
        const results = json.organic_results.map((item) => ({
          type: "academic",
          title: item.title,
          link: item.link,
          snippet: item.snippet,
          publication_info: item.publication_info,
          citations: item.inline_links?.cited_by?.total || 0,
        }));
        resolve(results);
      } else {
        console.error("No results found or error in Scholar API");
        reject(new Error("No results found or error in Scholar API"));
      }
    });
  });
};

const calculateScore = (result) => {
  switch (result.type) {
    case "video":
      return result.views * 0.6 + result.likes * 0.4;
    case "article":
    case "blog":
      return result.relevance * 100; // Scale up relevance to be comparable with video scores
    case "academic":
      return result.citations * 10; // Weight citations more heavily
    default:
      return 0;
  }
};

const search = async (req, res) => {
  try {
    const { query } = req.body;

    console.log("Starting search for query:", query);

    let youtubeResults, googleResults, scholarResults;

    try {
      youtubeResults = await searchYouTube(query);
      console.log("YouTube search completed");
    } catch (error) {
      console.error("Error in YouTube search:", error);
      youtubeResults = [];
    }

    try {
      googleResults = await searchGoogle(query);
      console.log("Google search completed");
    } catch (error) {
      console.error("Error in Google search:", error);
      googleResults = [];
    }

    try {
      scholarResults = await searchScholar(query);
      console.log("Scholar search completed");
    } catch (error) {
      console.error("Error in Scholar search:", error);
      scholarResults = [];
    }

    const allResults = [...youtubeResults, ...googleResults, ...scholarResults];

    console.log(`Total results: ${allResults.length}`);

    const rankedResults = allResults
      .map((result) => ({
        ...result,
        score: calculateScore(result),
      }))
      .sort((a, b) => b.score - a.score)
      .map((result, index) => ({
        ...result,
        rank: index + 1,
      }));

    if (req.user) {
      req.user.searchHistory.push(query);
      await req.user.save();
      console.log("Search history updated");
    }

    res.json(rankedResults);
  } catch (error) {
    console.error("Unexpected error in search:", error);
    res
      .status(500)
      .json({ error: "An unexpected error occurred during the search" });
  }
};

console.log(SerpApi);
module.exports = { search };
