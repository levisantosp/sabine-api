import { ResultsData } from "../../../types"

export default {
        get: async() => {
                const json = await (await fetch(
                        "https://esports-api.lolesports.com/persisted/gw/getSchedule?hl=en-US",
                        {
                                headers: {
                                        "x-api-key": "0TvQnueqKa5mxJntVWt0w4LpLfEkrV1Ta8rQBb9Z"
                                }
                        }
                )).json()

                const matches: ResultsData[] = json.data.schedule.events.map((e: any) => {
                        if(e.match) return {
                                id: e.match.id,
                                teams: [
                                        {
                                                name: e.match.teams[0].name,
                                                score: e.match.teams[0].result?.gameWins
                                        },
                                        {
                                                name: e.match.teams[1].name,
                                                score: e.match.teams[1].result?.gameWins
                                        }
                                ],
                                tournament: {
                                        name: e.league.name
                                },
                                stage: e.blockName,
                                when: new Date(e.startTime).getTime(),
                                status: e.state
                        }
                })

                return matches.filter(m => m && m.status === "completed")
        }
}