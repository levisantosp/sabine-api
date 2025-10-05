import type { ResultsData } from '../../../types/index.ts'

export default {
  get: async() => {
    const res = await (await fetch(
      'https://api.pandascore.co/lol/matches/past?per_page=100&sort=-end_at&filter[status]=finished',
      {
        headers: {
          accept: 'application/json',
          authorization: process.env.PANDA_TOKEN
        }
      }
    )).json()

    const matches: ResultsData[] = res.map((e: any) => {
      const winnerScore = Math.max(
        e.results[0]?.score,
        e.results[1]?.score
      )

      return {
        id: e.id.toString(),
        teams: [
          {
            name: e.opponents[0]?.opponent.name,
            score: e.results[0]?.score.toString(),
            winner: e.results[0]?.score === winnerScore ? true : false
          },
          {
            name: e.opponents[1]?.opponent.name,
            score: e.results[1]?.score.toString(),
            winner: e.results[1]?.score === winnerScore ? true : false
          }
        ],
        tournament: {
          name: e.league.name,
          full_name: `${e.league.name} ${e.serie.full_name}`,
          image: e.league.image_url
        },
        stage: e.tournament.name,
        when: new Date(e.scheduled_at),
        status: e.status
      }
    })

    return matches
  }
}