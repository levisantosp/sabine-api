import { LiveFeed } from "../../../types"

export default {
        get: async() => {
                const json = await (await fetch(
                        "https://esports-api.lolesports.com/persisted/gw/getLive?hl=en-US",
                        {
                                headers: {
                                        "x-api-key": "0TvQnueqKa5mxJntVWt0w4LpLfEkrV1Ta8rQBb9Z"
                                }
                        }
                )).json()

                const matches: LiveFeed[] = json.data.schedule.events.map((e: any) => {
                        let teams = e.match ? [
                                {
                                        name: e.match.teams[0].name,
                                        score: e.match.teams[0].result.gameWins
                                },
                                {
                                        name: e.match.teams[1].name,
                                        score: e.match.teams[1].result.gameWins
                                }
                        ] : []
                        return {
                                id: e.id,
                                tournament: {
                                        name: e.league.name,
                                        image: e.league.image
                                },
                                teams,
                                stage: e.blockName
                        }
                })

                return matches
        }
}