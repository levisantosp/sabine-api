import * as cheerio from "cheerio"
import { EventsData } from "../../../types";

export default {
  get: async() => {
    const html = await (await fetch("https://loltv.gg/events")).text();
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