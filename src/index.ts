import { type FastifyPluginAsyncTypebox, Type } from "@fastify/type-provider-typebox"
import fastify from "fastify"
import { Database } from "sileco.db"
import ValorantEvents from "./services/valorant/events.ts"
import ValorantMatches from "./services/valorant/matches.ts"
import ValorantLiveFeed from "./services/valorant/livefeed.ts"
import ValorantNews from "./services/valorant/news.ts"
import ValorantPlayers from "./services/valorant/players.ts"
import ValorantTeams from "./services/valorant/teams.ts"
import ValorantResults from "./services/valorant/results.ts"
import LOLMatches from "./services/lol/matches.ts"
import LOLEvents from "./services/lol/events.ts"
import LOLLiveFeed from "./services/lol/livefeed.ts"
import LOLResults from "./services/lol/results.ts"
import type { MatchesData, PlayerData, TeamData } from "../types/index.ts"
import type { preHandlerMetaHookHandler } from "fastify/types/hooks.js"
const db = new Database("db.json")

const auth: preHandlerMetaHookHandler = (req, res, done) => {
  if(req.url === "/invite") return done()
  if(req.headers.authorization !== process.env.AUTH) {
    res.status(401).send({ message: "Access denied" })
    return false
  }
  return done()
}

const setData = async() => {
  try {
    db.set("vlr_events", await ValorantEvents.get())
    db.set("vlr_matches", await ValorantMatches.get())
    db.set("vlr_results", await ValorantResults.get())
    db.set("vlr_news", await ValorantNews.get())
    db.set("vlr_players", await ValorantPlayers.get())
    db.set("vlr_teams", await ValorantTeams.get())
    db.set("lol_events", await LOLEvents.get())
    db.set("lol_matches", await LOLMatches.get())
    db.set("lol_results", await LOLResults.get())
  }
  catch (e) {
    console.log(e)
  }
}
await setData()

if(db.fetch("vlr_players_data")) db.remove("vlr_players_data")
if(db.fetch("vlr_teams_data")) db.remove("vlr_teams_data")
if(!db.fetch("vlr_live_matches")) db.set("vlr_live_matches", [])
if(!db.fetch("lol_live_matches")) db.set("lol_live_matches", [])

const routes: FastifyPluginAsyncTypebox = async(fastify) => {
  fastify.get("/invite", {}, (req, res) => {
    return res.redirect("https://discord.com/oauth2/authorize?client_id=1235576817683922954&scope=bot&permissions=388096", 301).code(200)
  })
  fastify.get("/events/valorant", {}, () => {
    return db.fetch("vlr_events")
  })
  fastify.get("/results/valorant", {}, () => {
    return db.fetch("vlr_results")
  })
  fastify.get("/matches/valorant", {}, () => {
    return db.fetch("vlr_matches")
  })
  fastify.get("/live/valorant", {}, () => {
    return db.fetch("vlr_matches").filter((m: MatchesData) => m.status === "LIVE")
  })
  fastify.get("/players/valorant", {
    schema: {
      querystring: Type.Object({
        id: Type.Optional(Type.String())
      })
    }
  }, async(req) => {
    if(req.query.id) {
      let player_data = db.fetch("vlr_players_data")?.find((p: PlayerData) => p.id === req.query.id)
      let __players = db.fetch("vlr_players_data") ?? []
      if(!player_data) {
        player_data = await ValorantPlayers.getById(req.query.id)
        __players.push(player_data)
        db.set("vlr_players_data", __players)
      }
      return player_data
    }
    else {
      return db.fetch("vlr_players")
    }
  })
  fastify.get("/teams/valorant", {
    schema: {
      querystring: Type.Object({
        id: Type.Optional(Type.String())
      })
    }
  }, async(req, res) => {
    if(req.query.id) {
      let team_data = db.fetch("vlr_teams_data")?.find((t: TeamData) => t.id === req.query.id)
      let __teams = db.fetch("vlr_teams_data") ?? []
      if(!team_data) {
        team_data = await ValorantTeams.getById(req.query.id)
        __teams.push(team_data)
        db.set("vlr_teams_data", __teams)
      }
      if(team_data.name === "") {
        res.status(401).send({ message: "Invalid team" })
        return false
      }
      else {
        return team_data
      }
    }
    else {
      return db.fetch("vlr_teams")
    }
  })
  fastify.get("/events/lol", {}, () => {
    return db.fetch("lol_events")
  })
  fastify.get("/matches/lol", {}, () => {
    return db.fetch("lol_matches")
  })
  fastify.get("/results/lol", {}, () => {
    return db.fetch("lol_results")
  })
  fastify.get("/live/lol", {}, () => {
    return db.fetch("lol_live_matches")
  })
}
const send_webhook = async(data: any[], path: string) => {
  try {
    const res = await fetch(process.env.WEBHOOK_URL + path, {
      method: "post",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    })
    if(!res.ok) {
      console.log("Failed to send webhook in path", process.env.WEBHOOK_URL + path)
    }
  }
  catch(e) {
    console.error(e)
  }
}

const server = fastify()
if(!process.env.INTERVAL) {
  server.addHook("preHandler", auth)
}
await server.register(routes)
await server.listen({ host: "0.0.0.0", port: 3000 })
console.log("API is running")

const updateDb = async() => {
  try {
    const vlr_new_events = await ValorantEvents.get()
    const vlr_new_matches = await ValorantMatches.get()
    const vlr_new_news = await ValorantNews.get()
    const lol_new_events = await LOLEvents.get()
    const lol_new_matches = await LOLMatches.get()
    const vlr_old_news = db.fetch("vlr_news")
    const vlr_array_news = vlr_new_news.filter(nn => !vlr_old_news.some((on: any) => JSON.stringify(nn) === JSON.stringify(on)))
    if(vlr_array_news.length) {
      await send_webhook(vlr_array_news, "/webhooks/news/valorant")
    }
    if(vlr_new_news.length) db.set("vlr_news", vlr_new_news)
    if(vlr_new_events.length) db.set("vlr_events", vlr_new_events)
    if(vlr_new_matches.length) db.set("vlr_matches", vlr_new_matches)
    if(lol_new_events.length) db.set("lol_events", lol_new_events)
    if(lol_new_matches.length) db.set("lol_matches", lol_new_matches)
  }
  catch (e) {
    console.error(e)
  }
  setTimeout(async() => await updateDb(), 300000)
}
setInterval(async() => {
  try {
    const vlr_new_events = await ValorantEvents.get()
    const vlr_new_matches = await ValorantMatches.get()
    const vlr_new_news = await ValorantNews.get()
    const lol_new_events = await LOLEvents.get()
    const lol_new_matches = await LOLMatches.get()
    const vlr_old_news = db.fetch("vlr_news")
    const vlr_array_news = vlr_new_news.filter(nn => !vlr_old_news.some((on: any) => JSON.stringify(nn) === JSON.stringify(on)))
    if(vlr_array_news.length) {
      await send_webhook(vlr_array_news, "/webhooks/news/valorant")
    }
    if(vlr_new_news.length) db.set("vlr_news", vlr_new_news)
    if(vlr_new_events.length) db.set("vlr_events", vlr_new_events)
    if(vlr_new_matches.length) db.set("vlr_matches", vlr_new_matches)
    if(lol_new_events.length) db.set("lol_events", lol_new_events)
    if(lol_new_matches.length) db.set("lol_matches", lol_new_matches)
  }
catch(e) {
  console.error(e)
}
}, process.env.INTERVAL ?? 300000)

setInterval(async() => {
  try {
    const vlr_live_matches = db.fetch("vlr_matches")
    const lol_live_matches = await LOLLiveFeed.get()
    let vlr_matches = []
    let lol_matches = []
    for(const live_match of vlr_live_matches.filter((m: MatchesData) => m.status === "LIVE")) {
      const match = await ValorantLiveFeed.get(live_match.id)
      vlr_matches.push(match)
    }
    for(const live_match of lol_live_matches) {
      lol_matches.push(live_match)
    }
    let new_results = await ValorantResults.get()
    let lol_new_results = await LOLResults.get()
    let old = db.fetch("vlr_live_matches")
    let old_lol_live_matches = db.fetch("lol_live_matches")
    let old_results = db.fetch("vlr_results")
    let lol_old_results = db.fetch("lol_results")
    let array = vlr_matches.filter(m => !old?.some((om: any) => JSON.stringify(m) === JSON.stringify(om)))
    let results_array = new_results.filter(r => !old_results.some((or: any) => JSON.stringify(r) === JSON.stringify(or)))
    let lol_results_array = lol_new_results.filter(r => !lol_old_results.some((or: any) => JSON.stringify(r) === JSON.stringify(or)))
    let lol_live_matches_array = lol_matches.filter((m: any) => !old_lol_live_matches.some((om: any) => JSON.stringify(m) === JSON.stringify(om)))
    if(array.length) {
      db.set("vlr_live_matches", vlr_matches)
      await send_webhook(array, "/webhooks/live/valorant")
    }
    // console.log(old_results.slice(0, 10))
    // console.log("-------------------------------")
    // console.log(results_array.slice(0, 10))
    if(results_array.length) {
      db.set("vlr_results", new_results)
      // await send_webhook(results_array, "/webhooks/results/valorant")
    }
    if(lol_results_array.length) {
      if(lol_new_results.length) db.set("lol_results", lol_new_results)
      await send_webhook(lol_results_array, "/webhooks/results/lol")
    }
    if(lol_live_matches_array.length) {
      if(lol_matches.length) db.set("lol_live_matches", lol_matches)
      await send_webhook(lol_live_matches_array, "/webhooks/live/lol")
    }
  }
  catch(e) {
    console.error(e)
  }
}, process.env.INTERVAL ?? 30000)