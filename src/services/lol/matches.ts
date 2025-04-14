import puppeteer from "puppeteer"
import { MatchesData } from "../../../types"

export default {
        get: async() => {
                const browser = await puppeteer.launch()
                const page = await browser.newPage()
                await page.goto("https://loltv.gg/matches")
                const matches = await page.$$eval("section.flex.flex-col.gap-2", sections => {
                        const __matches: MatchesData[] = []
                        for(const section of sections) {
                                const date = section.querySelector("h2.px-3")
                                for(const el of Array.from(section.querySelectorAll("li a[href^='/match/']"))) {
                                        const url = el.getAttribute("href") ?? ""
                                        const id = url.split("/")[2]
                                        const tournament = {
                                                name: el.querySelector("div.shrink-0 p.text-sm.font-medium.leading-none")!.textContent!.trim()
                                        }
                                        const stage = el.querySelector("div.shrink-0 div.text-neutral-50.font-medium.text-xs.leading-none")!.textContent!.trim()
                                        
                                        const team_elements = section.querySelectorAll("div.truncate.grow.flex.flex-col.gap-2 div.truncate.flex.flex-row.items-center.gap-3")
                                        const teams = []
                                        for(const team_el of Array.from(team_elements)) {
                                                teams.push({ name: team_el.querySelector("p.font-medium.truncate")!.textContent!.trim() })
                                        }

                                        const hour = el.querySelectorAll(".text-neutral-50")[1].textContent!.trim()
                                        const timestamp = new Date(`${date} ${hour}`).getTime()
                                        __matches.push({
                                                id,
                                                teams: teams.slice(0, 2),
                                                tournament,
                                                url: "https://loltv.gg" + url,
                                                stage,
                                                when: timestamp,
                                                status: isNaN(timestamp) ? "LIVE" : "Upcoming"
                                        })
                                }
                        }
                        return __matches
                })

                await browser.close()
                return matches
        }
}