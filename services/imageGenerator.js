import OpenAI from "openai";
import { retry } from "../utils/retry.js";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateImages(keyword, alts = []) {
  const prompts =
    alts.length > 0
      ? alts
      : [
          `Modern tech illustration about ${keyword}`,
          `Clean infographic style image about ${keyword}`,
        ];

  const outputs = [];
  for (const alt of prompts.slice(0, 2)) {
    const res = await retry(() =>
      client.images.generate({
        model: "gpt-image-1",
        prompt: alt,
        size: "1024x1024",
        response_format: "url",
      })
    );
    const url = res.data?.[0]?.url;
    if (url) outputs.push({ url, alt });
  }
  return outputs;
}
