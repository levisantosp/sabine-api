import puppeteer from "puppeteer"
import { NewsData } from "../../../types"

export default {
        get: async() => {
                const browser = await puppeteer.launch({
                        args: ["--no-sandbox", "--disable-setuid-sandbox"],
                        headless: true,
                        executablePath: "/usr/bin/google-chrome"
                })
                const page = await browser.newPage()
                await page.goto("https://loltv.gg/news")
                const news = await page.$$eval("ol > li", elements => {
                        const __news: NewsData[] = []
                        for(const el of elements) {
                                const url = "https://loltv.gg" + el.querySelector("a")?.getAttribute("href")
                                const title = el.querySelector("p")?.textContent?.trim()!
                                __news.push({
                                        title,
                                        url
                                })
                        }
                        return __news
                })

                await browser.close()
                return news.filter(n => n.url.startsWith("https://loltv.gg/thread/"))
        }
}