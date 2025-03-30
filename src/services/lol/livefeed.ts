import * as cheerio from "cheerio"
import { LiveFeed, PlayerLastResultTeam } from "../../../types"

export default {
  get: async(id: string) => {
    const html = await (await fetch("https://loltv.gg/match/" + id, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
      }
    })).text();
    const $ = cheerio.load(html);
    const teams: PlayerLastResultTeam[] = [];
    $("a[aria-label]").each((i, el) => {
      if(i >= 2) return;
      teams.push({
        name: $(el).attr("aria-label")!
      });
    });
    const [score1, splitter, score2] = $(".text-2xl.whitespace-nowrap").first().text().trim().split(" ");
    const stage = $("div.text-neutral-50.font-medium.text-xs.leading-none").last().text().trim();
    const tournament = {
      name: $("p.text-sm.font-medium.leading-none").last().text().trim()
    }
    if(teams.length) {
      teams[0].score = score1;
      teams[1].score = score2;
    }
    return {
      id,
      teams,
      url: "https://loltv.gg/match/" + id,
      stage,
      tournament
    } as LiveFeed;
  }
}