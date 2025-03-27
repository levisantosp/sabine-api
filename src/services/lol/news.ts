import * as cheerio from "cheerio"
import { NewsData } from "../../../types";

export default {
  get: async() => {
    const html = await (await fetch("https://loltv.gg/news")).text();
    const $ = cheerio.load(html);
    let news: NewsData[] = [];
    $("ol > li").each((_, el) => {
      const $news = $(el);
      const url = "https://loltv.gg" + $news.find("a").attr("href")
      const title = $news.find("p").text().trim();
      news.push({
        title,
        url
      });
    });
    return news.filter(n => n.url.startsWith("https://loltv.gg/thread/"));
  }
}