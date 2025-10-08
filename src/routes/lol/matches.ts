import type { FastifyInstance } from 'fastify'
import { prisma } from '../../database/prisma.ts'

export default function(fastify: FastifyInstance) {
  fastify.get('/matches/lol', {}, async() => {
    const matches = await prisma.lolMatch.findMany({
      include: {
        teams: true
      }
    })

    return matches.map(({ tournamentFullName, tournamentImage, tournamentName, ...m }) => ({
      ...m,
      tournament: {
        name: tournamentName,
        image: tournamentImage,
        full_name: tournamentFullName
      }
    }))
  })
}