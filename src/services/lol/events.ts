import * as cheerio from "cheerio"
import { EventsData } from "../../../types";

export default {
  get: async() => {
    const html = await (await fetch("https://loltv.gg/events", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
      }
    })).text();
    const $ = cheerio.load(html);
    const events: EventsData[] = [];
    $("p.text-sm.font-medium.leading-none").each((_, el) => {
      events.push({
        name: $(el).text()
      });
    });
    return events;
  }
}