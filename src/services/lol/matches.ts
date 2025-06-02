import { MatchesData } from "../../../types"

export default {
  get: async () => {
    const res = await (await fetch(
      "https://api.pandascore.co/lol/matches/upcoming?per_page=100&sort=begin_at",
      {
        headers: {
          accept: "application/json",
          authorization: process.env.PANDA_TOKEN
        }
      }
    )).json()

    const matches: MatchesData[] = res.map((e: any) => {
      return {
        id: e.id.toString(),
        teams: [
          {
            name: e.opponents[0]?.opponent.name
          },
          {
            name: e.opponents[1]?.opponent.name
          }
        ],
        tournament: {
          name: e.league.name,
          full_name: `${e.league.name} ${e.serie.full_name}`,
          image: e.league.image_url
        },
        stage: e.tournament.name,
        when: new Date(e.scheduled_at).getTime(),
        status: e.status
      }
    })

    return matches.filter(m => m && m.status !== "completed")
  }
}