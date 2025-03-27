import * as cheerio from "cheerio"
import { PlayerLastResultTeam, ResultsData, ResultsTeam } from "../../../types";

export default {
  get: async() => {
    const html = await (await fetch("https://loltv.gg/matches/results")).text();
    const $ = cheerio.load(html);
    const results: ResultsData[] = [];
    $("section").each((_, el) => {
      const $section = $(el);
      const date = $section.find("h2").text().trim();
      $section.find("li").each((_, match) => {
        const $match = $(match);
        const url = $match.find("a").attr("href");
        const teams: any[] = $match.find("p.font-medium.truncate").map((_, el) => {
          return {
            name: $(el).text().trim()
          }
        }).get();
        const scores = $match.find("p.font-medium.text-sm").map((_, el) => $(el).text().trim()).get();
        teams[0].score = scores[1];
        teams[1].score = scores[3];
        const tournament = {
          name: $match.find("div").find("p").last().text()
        }
        const stage = $match.find("div").last().text().trim();
        const hour = $match.find("div").find("p.text-neutral-50").first().text().trim();
        const timestamp = new Date(`${date} ${hour}`).getTime();
        results.push({
          id: url!.split("/")[2],
          teams,
          tournament,
          stage,
          when: timestamp,
          url: "https://loltv.gg" + url
        });
      });
    });
    return results;
  }
}