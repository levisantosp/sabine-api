import { EventsData } from "../../../types/index.js"

export default {
        get: async() => {
                const json = await (await fetch(
                        "https://esports-api.lolesports.com/persisted/gw/getLeagues?hl=en-US",
                        {
                                headers: {
                                        "x-api-key": "0TvQnueqKa5mxJntVWt0w4LpLfEkrV1Ta8rQBb9Z"
                                }
                        }
                )).json()

                const events: EventsData[] = json.data.leagues.map((d: any) => (
                        {
                                name: d.name,
                                id: d.id,
                                image: d.image
                        }
                ))
                
                return events
        }
}