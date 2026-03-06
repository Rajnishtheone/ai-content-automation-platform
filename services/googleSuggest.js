import axios from "axios";

const GOOGLE_SUGGEST_URL =
  "https://suggestqueries.google.com/complete/search?client=firefox&q=";

export async function fetchSuggestions(keyword) {
  const url = `${GOOGLE_SUGGEST_URL}${encodeURIComponent(keyword)}`;
  const res = await axios.get(url);
  return Array.isArray(res.data?.[1]) ? res.data[1] : [];
}
