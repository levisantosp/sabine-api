import type { EventsData } from '../../../types/index.d.ts'

export default {
  get: async() => {
    const res = await (await fetch(
      'https://api.pandascore.co/lol/leagues?per_page=100',
      {
        headers: {
          accept: 'application/json',
          authorization: process.env.PANDA_TOKEN
        }
      }
    )).json()

    if(!res.length) return []

    let events: EventsData[] = res.map((d: any) => (
      {
        name: d.name,
        id: d.id.toString(),
        image: d.image_url
      }
    ))

    const seen = new Set<string>()

    events = events.filter(i => {
      if(seen.has(i.name)) return false
      
      seen.add(i.name)

      return true
    })

    return events
  }
}