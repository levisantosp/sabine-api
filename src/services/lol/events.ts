import { EventsData } from "../../../types/index.js"

export default {
        get: async() => {
                const res = await (await fetch(
                        "https://api.pandascore.co/lol/leagues?per_page=100",
                        {
                                headers: {
                                        accept: "application/json",
                                        authorization: process.env.PANDA_TOKEN
                                }
                        }
                )).json()
                
                let events: EventsData[] = res.map((d: any) => (
                        {
                                name: d.name,
                                id: d.id,
                                image: d.image_url
                        }
                ))

                let seen = new Set()
                events = events.filter(i => {
                        if(seen.has(i.name)) return false
                        seen.add(i.name)
                        return true
                })
                
                return events
        }
}