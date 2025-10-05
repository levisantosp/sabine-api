import type { Prisma } from '@prisma/client'
import { error, send } from './utils/logger.ts'
import lolEvents from './services/lol/events.ts'
import lolMatches from './services/lol/matches.ts'
import lolResults from './services/lol/results.ts'
import events from './services/valorant/events.ts'
import matches from './services/valorant/matches.ts'
import results from './services/valorant/results.ts'
import news from './services/valorant/news.ts'
import { prisma } from './database/prisma.ts'
import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'
import fastify from 'fastify'
import { auth } from './utils/auth.ts'
import sendWebhook from './utils/sendWebhook.ts'
import type { LiveFeed } from '../types/index.d.ts'
import livefeed from './services/valorant/livefeed.ts'
import lolLiveFeed from './services/lol/livefeed.ts'

const setData = async() => {
  try {
    const lol = {
      events: await lolEvents.get(),
      matches: (await lolMatches.get()).map(({ tournament, teams, ...m }) => ({
        ...m,
        tournamentName: tournament.name,
        tournamentFullName: tournament.full_name,
        tournamentImage: tournament.image,
        teams: {
          createMany: {
            data: teams
          }
        }
      })),
      results: (await lolResults.get()).map(({ tournament, teams, ...m }) => ({
        ...m,
        tournamentName: tournament.name,
        tournamentFullName: tournament.full_name,
        tournamentImage: tournament.image,
        teams: {
          createMany: {
            data: teams
          }
        }
      }))
    } as const

    const val = {
      events: await events.get(),
      matches: (await matches.get()).map(({ tournament, teams, ...m }) => ({
        ...m,
        tournamentName: tournament.name,
        tournamentFullName: tournament.full_name,
        tournamentImage: tournament.image,
        teams: {
          createMany: {
            data: teams
          }
        }
      })),
      results: (await results.get()).map(({ tournament, teams, ...m }) => ({
        ...m,
        tournamentName: tournament.name,
        tournamentFullName: tournament.full_name,
        tournamentImage: tournament.image,
        teams: {
          createMany: {
            data: teams
          }
        }
      })),
      news: await news.get()
    } as const

    const transactions: Prisma.PrismaPromise<any>[] = []

    await prisma.$transaction([
      prisma.news.deleteMany(),
      prisma.valEvent.deleteMany(),
      prisma.valMatch.deleteMany(),
      prisma.lolEvent.deleteMany(),
      prisma.lolMatch.deleteMany()
    ])
    
    for(const event of lol.events) {
      transactions.push(prisma.lolEvent.create({ data: event }))
    }

    for(const match of lol.matches) {
      transactions.push(prisma.lolMatch.create({ data: match }))
    }

    for(const match of lol.results) {
      transactions.push(prisma.lolResult.create({ data: match }))
    }

    for(const event of val.events) {
      transactions.push(prisma.valEvent.create({ data: event }))
    }

    for(const match of val.matches) {
      transactions.push(prisma.valMatch.create({ data: match }))
    }

    for(const match of val.results) {
      transactions.push(prisma.valResult.create({ data: match }))
    }

    for(const news of val.news) {
      transactions.push(prisma.news.create({ data: news }))
    }

    await prisma.$transaction(transactions)
  }
  catch(e) {
    error(e as Error)
  }
}

await setData()

await prisma.$transaction([
  prisma.lolLiveMatch.deleteMany(),
  prisma.valLiveMatch.deleteMany()
])

const server = fastify()

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

for(const folder of fs.readdirSync(path.resolve(__dirname, './routes'))) {
  for(const file of fs.readdirSync(path.resolve(__dirname, `./routes/${folder}`))) {
    const route = await import(`./routes/${folder}/${file}`)

    await server.register(route)
  }
}

server.listen({ host: '0.0.0.0', port: 3000 })
  .then(() => send('HTTP server running at 3000'))

server.addHook('preHandler', auth)

const sendNews = async() => {
  try {
    const val = {
      news: await news.get()
    } as const

    const oldNews = await prisma.news.findMany()
    const arrayNews = val.news.filter(nn => !oldNews.some((on: any) => JSON.stringify(nn) === JSON.stringify(on)))

    if(arrayNews.length) {
      await sendWebhook(arrayNews, '/webhooks/news/valorant')
    }
  }
  catch(e) {
    error(e as Error)
  }

  setTimeout(sendNews, process.env.INTERVAL ?? 300000)
}

const sendLiveAndResults = async() => {
  try {
    const lol = {
      results: (await lolResults.get()).map(({ tournament, teams, ...m }) => ({
        ...m,
        tournamentName: tournament.name,
        tournamentFullName: tournament.full_name,
        tournamentImage: tournament.image,
        teams: {
          createMany: {
            data: teams
          }
        }
      })),
      liveMatches: await lolLiveFeed.get()
    } as const

    const val = {
      results: (await results.get()).map(({ tournament, teams, ...m }) => ({
        ...m,
        tournamentName: tournament.name,
        tournamentFullName: tournament.full_name,
        tournamentImage: tournament.image,
        teams: {
          createMany: {
            data: teams
          }
        }
      })),
      liveMatches: (await matches.get()).filter(m => m.stage === 'LIVE')
    } as const

    const vlrLiveMatches: LiveFeed[] = []
    const lolLiveMatches: LiveFeed[] = []

    for(const m of val.liveMatches) {
      const match = await livefeed.get(m.id)

      vlrLiveMatches.push(match)
    }

    for(const m of lol.liveMatches) {
      lolLiveMatches.push(m)
    }

    const vlrOldLiveMatches = await prisma.lolLiveMatch.findMany()
    const lolOldLiveMatches = await prisma.lolLiveMatch.findMany()

    const vlrOldResults = await prisma.valResult.findMany()
    const lolOldResults = await prisma.lolResult.findMany()

    const vlrResultsArray = val.results.filter(r => !vlrOldResults.some(or => or.id === r.id))
    const lolResultsArray = lol.results.filter(r => !lolOldResults.some((or: any) => JSON.stringify(r) === JSON.stringify(or)))

    const liveVlrArray = vlrLiveMatches.filter(m => !vlrOldLiveMatches.some(om => JSON.stringify(m) === JSON.stringify(om)))
    const liveLolArray = lolLiveMatches.filter((m: any) => !lolOldLiveMatches.some(om => JSON.stringify(m) === JSON.stringify(om)))

    if(liveVlrArray.length) {
      const transactions: Prisma.PrismaPromise<any>[] = [prisma.lolLiveMatch.deleteMany()]

      for(const match of vlrLiveMatches) {
        const { streams, ...m } = match

        transactions.push(
          prisma.lolLiveMatch.create({
            data: {
              ...m,
              currentMap: m.currentMap!,
              id: m.id.toString(),
              tournamentName: m.tournament.name,
              tournamentImage: m.tournament.image,
              teams: {
                createMany: {
                  data: m.teams.map(t => ({
                    ...t,
                    score: t.score as string
                  }))
                }
              }
            }
          })
        )
      }

      await sendWebhook(liveVlrArray, '/webhooks/live/valorant')
    }

    if(vlrResultsArray.length) {
      const transactions: Prisma.PrismaPromise<any>[] = [prisma.valResult.deleteMany()]

      for(const m of val.results) {
        transactions.push(prisma.valResult.create({ data: m }))
      }

      await sendWebhook(vlrResultsArray, '/webhooks/results/valorant')
    }

    if(lolResultsArray.length) {
      const transactions: Prisma.PrismaPromise<any>[] = [prisma.lolResult.deleteMany()]

      for(const m of val.results) {
        transactions.push(prisma.lolResult.create({ data: m }))
      }

      await sendWebhook(lolResultsArray, '/webhooks/results/lol')
    }

    if(liveLolArray.length) {
      const transactions: Prisma.PrismaPromise<any>[] = [prisma.lolLiveMatch.deleteMany()]

      for(const match of lolLiveMatches) {
        const { streams, ...m } = match

        transactions.push(
          prisma.lolLiveMatch.create({
            data: {
              ...m,
              currentMap: m.currentMap!,
              id: m.id.toString(),
              tournamentName: m.tournament.name,
              tournamentImage: m.tournament.image,
              teams: {
                createMany: {
                  data: m.teams.map(t => ({
                    ...t,
                    score: t.score as string
                  }))
                }
              }
            }
          })
        )
      }

      await sendWebhook(liveLolArray, '/webhooks/live/lol')
    }
  }
  catch(e) {
    error(e as Error)
  }

  setTimeout(sendLiveAndResults, process.env.INTERVAL ?? 30000)
}

sendNews()
sendLiveAndResults()