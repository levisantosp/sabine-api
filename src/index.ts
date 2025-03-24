import "dotenv/config.js"
import { FastifyPluginAsyncTypebox, Type } from "@fastify/type-provider-typebox"
import fastify from "fastify"
import { preHandlerMetaHookHandler } from "fastify/types/hooks"
import events from "./services/valorant/events.js"
import matches from "./services/valorant/matches.js"
import { Database } from "sileco.db"
import livefeed from "./services/valorant/livefeed.js"
import news from "./services/valorant/news.js"
import players from "./services/valorant/players.js"
import teams from "./services/valorant/teams.js"
import results from "./services/valorant/results.js"
const db = new Database("db.json");

const auth: preHandlerMetaHookHandler = (req, res) => {
  if(req.headers.authorization !== process.env.AUTH) {
    res.status(401).send({ message: "Access denied" });
    return false;
  }
  return true;
}

db.set("vlr_events", await events.get());
db.set("vlr_matches", await matches.get());
db.set("vlr_results", await results.get());
db.set("vlr_news", await news.get());
db.set("vlr_players", await players.get());
db.set("vlr_teams", await teams.get());
if(db.fetch("vlr_players_data")) db.remove("vlr_players_data");
if(db.fetch("vlr_teams_data")) db.remove("vlr_teams_data");

const routes: FastifyPluginAsyncTypebox = async(fastify) => {
  fastify.get("/events/valorant", {}, () => {
    return db.fetch("vlr_events");
  });
  fastify.get("/matches/valorant", {}, () => {
    return db.fetch("vlr_matches");
  });
  fastify.get("/live/valorant", {}, () => {
    return db.fetch("vlr_matches").filter((m: any) => m.status === "LIVE");
  });
  fastify.get("/players/valorant", {
    schema: {
      querystring: Type.Object({
        id: Type.Optional(Type.String())
      })
    }
  }, async(req) => {
    if(req.query.id) {
      let player_data = db.fetch("vlr_players_data")?.find((p: any) => p.id === req.query.id);
      let __players = db.fetch("vlr_players_data") ?? [];
      if(!player_data) {
        player_data = await players.getById(req.query.id);
        __players.push(player_data);
        db.set("vlr_players_data", __players);
      }
      return player_data;
    }
    else {
      return db.fetch("vlr_players");
    }
  });
  fastify.get("/teams/valorant", {
    schema: {
      querystring: Type.Object({
        id: Type.Optional(Type.String())
      })
    }
  }, async(req, res) => {
    if(req.query.id) {
      let team_data = db.fetch("vlr_teams_data")?.find((t: any) => t.id === req.query.id);
      let __teams = db.fetch("vlr_teams_data") ?? [];
      if(!team_data) {
        team_data = await teams.getById(req.query.id);
        __teams.push(team_data);
        db.set("vlr_teams_data", __teams);
      }
      if(team_data.name === "") {
        res.status(401).send({ message: "Invalid team" });
        return false;
      }
      else {
        return team_data;
      }
    }
    else {
      return db.fetch("vlr_teams");
    }
  });
}
const send_webhook = async(data: any[], path: string) => {
  try {
    const res = await fetch(process.env.WEBHOOK_URL + path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });
    if(!res.ok) {
      console.log("Failed to send webhook in path", path);
    }
  }
  catch(e) {
    console.error(e);
  }
}

const server = fastify();
if(!process.env.INTERVAL) {
  server.addHook("preHandler", auth);
}
await server.register(routes);
await server.listen({ host: "0.0.0.0", port: 3000 });
console.log("API is running");

setInterval(async() => {
  const vlr_new_events = await events.get();
  const vlr_new_matches = await matches.get();
  const vlr_new_news = await news.get();
  const vlr_old_matches = db.fetch("vlr_matches");
  const vlr_old_news = db.fetch("vlr_news");
  const vlr_array_matches = vlr_new_matches.filter(nm => !vlr_old_matches.some((om: any) => JSON.stringify(nm) === JSON.stringify(om)));
  const vlr_array_news = vlr_new_news.filter(nn => !vlr_old_news.some((on: any) => JSON.stringify(nn) === JSON.stringify(on)));

  if(vlr_array_matches.length) {
    await send_webhook(vlr_array_matches, "/webhooks/matches/valorant");
  }
  if(vlr_array_news.length) {
    await send_webhook(vlr_array_news, "/webhooks/news/valorant");
  }

  db.set("vlr_events", vlr_new_events);
  db.set("vlr_matches", vlr_new_matches);
}, process.env.INTERVAL ?? 300000);

setInterval(async() => {
  const vlr_live_matches = db.fetch("vlr_matches").filter((m: any) => m.status === "LIVE");
  if(!vlr_live_matches.length) return;
  
  let vlr_matches = [];
  for(const live_match of vlr_live_matches) {
    const match = await livefeed.get(live_match.id);
    vlr_matches.push(match);
  }

  let new_results = await results.get();
  let old = db.fetch("vlr_live_matches");
  let old_results = db.fetch("vlr_results");
  let array = vlr_matches.filter(m => !old?.some((om: any) => JSON.stringify(m) === JSON.stringify(om)));
  let results_array = new_results.filter(r => !old_results.some((or: any) => JSON.stringify(r) === JSON.stringify(or)))
  
  if(array.length) {
    await send_webhook(array, "/webhooks/live/valorant");
  }
  if(results_array.length) {
    await send_webhook(results_array, "/webhooks/results/valorant");
  }
  if(JSON.stringify(old) !== JSON.stringify(vlr_matches)) {
    db.set("vlr_live_matches", vlr_matches);
  }
}, process.env.INTERVAL ?? 30000);