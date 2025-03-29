import * as cheerio from "cheerio"
import { MatchesData, MatchTeam } from "../../../types";

export default {
  get: async () => {
    const html = await (await fetch("https://loltv.gg/matches", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
      }
    })).text();
    const $ = cheerio.load(html);
    const matches: MatchesData[] = [];
    $("section.flex.flex-col.gap-2").each((i, el) => {
      const $section = $(el);
      const date = $section.find("h2.px-3").text();
      $section.find("li a[href^='/match/']").each((i, match_element) => {
        const $match = $(match_element);
        const url = $match.attr("href");
        const id = url?.split("/")[2];
        const tournament = {
          name: $match.find("div.shrink-0").find("p.text-sm.font-medium.leading-none").text().trim()
        }
        const stage = $match.find("div.shrink-0").find("div.text-neutral-50.font-medium.text-xs.leading-none").text();
        const teams: MatchTeam[] = [];
        $match.find("div.truncate.grow.flex.flex-col.gap-2 div.truncate.flex.flex-row.items-center.gap-3").each((i, team_element) => {
          teams.push({
            name: $(team_element).find("p.font-medium.truncate").text().trim()
          });
        });
        const hour = $match.find(".text-neutral-50").eq(1).text();
        const timestamp = new Date(`${date} ${hour}`).getTime();
        matches.push({
          id: id!,
          teams,
          tournament,
          url: "https://loltv.gg" + url,
          stage,
          when: timestamp,
          status: isNaN(timestamp) ? "LIVE" : "Upcoming"
        });
      });
    });
    return matches;
  }
}