import puppeteer from "puppeteer"
import { ResultsData } from "../../../types"

export default {
        get: async() => {
                const browser = await puppeteer.launch({
                        args: ["--no-sandbox", "--disable-setuid-sandbox"],
                        headless: true,
                        executablePath: "/usr/bin/google-chrome"
                })
                const page = await browser.newPage()
                await page.goto("https://loltv.gg/matches/results")
                const results = await page.$$eval("section", elements => {
                        const __results: ResultsData[] = []
                        for(const el of elements) {
                                const date = el.querySelector("h2.px-3.font-medium")?.textContent?.trim()!
                                for(const $match of Array.from(el.querySelectorAll("li"))) {
                                        const url = $match.querySelector("a")?.getAttribute("href")!
                                        const teams_els = $match.querySelectorAll("p.font-medium.truncate")
                                        const teams = Array.from(teams_els).map(el => ({
                                                name: el.textContent?.trim()!,
                                                score: ""
                                        }))

                                        const score_els = $match.querySelectorAll("p.font-medium.text-sm")
                                        const scores = Array.from(score_els).map(el => {
                                                let array = el.textContent?.trim()!
                                                return array
                                        })
                                        teams[0].score = scores[1]
                                        teams[1].score = scores[3]
                                        const tournament = {
                                                name: $match.querySelector("p.text-sm.font-medium.leading-none")?.textContent?.trim()!
                                        }
                                        const stage = $match.querySelector("div.text-neutral-50.font-medium.text-xs.leading-none")?.textContent?.trim()!
                                        const hour = $match.querySelectorAll("p.text-neutral-50").item(1)?.textContent?.trim()
                                        const timestamp = new Date(`${date} ${hour}`).getTime()

                                        __results.push({
                                                id: url.split("/")[2],
                                                teams,
                                                tournament,
                                                stage,
                                                when: timestamp,
                                                url: "https://loltv.gg" + url
                                        })
                                }
                        }
                        return __results
                })
                
                await browser.close()
                return results
        }
}