import puppeteer from "puppeteer"
import { LiveFeed } from "../../../types"

export default {
        get: async(id: string): Promise<LiveFeed> => {
                const browser = await puppeteer.launch()
                const page = await browser.newPage()
                await page.goto("https://loltv.gg/match/" + id)
                const teams = await page.$$eval("a[aria-label]", elements => {
                        return elements.slice(0, 2).map(el => ({ name: el.getAttribute("aria-label")!, score: "" }))
                })
                const [score1, score2] = await page.$eval(".text-2xl.whitespace-nowrap", el => {
                        let array = el.textContent!.trim().split(" ")
                        array.splice(1, 1)
                        return array
                })
                const stage = await page.$$eval("div.text-neutral-50.font-medium.text-xs.leading-none", elements => {
                        const last = elements[elements.length - 1]
                        return last.textContent!.trim()
                })
                const tournament = {
                        name: await page.$$eval("p.text-sm.font-medium.leading-none", elements => {
                                const last = elements[elements.length - 1]
                                return last.textContent!.trim()
                        })
                }
                
                teams[0].score = score1
                teams[1].score = score2

                await browser.close()
                return {
                        id,
                        teams,
                        url: "https://loltv.gg/match/" + id,
                        stage,
                        tournament
                }
        }
}