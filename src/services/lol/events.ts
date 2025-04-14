import puppeteer from "puppeteer"
import { EventsData } from "../../../types"

export default {
        get: async() => {
                const browser = await puppeteer.launch({
                        args: ['--no-sandbox', '--disable-setuid-sandbox']
                })
                const page = await browser.newPage()
                await page.goto("https://loltv.gg/events")
                const events = await page.$$eval("p.text-sm.font-medium.leading-none", elements => {
                        return elements.map(el => ({ name: el.textContent?.trim() }))
                })

                await browser.close()
                return events
        }
}