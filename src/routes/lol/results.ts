import type { FastifyInstance } from 'fastify'
import { prisma } from '../../database/prisma.ts'

export default function(fastify: FastifyInstance) {
  fastify.get('/results/lol', {}, async() => {
    const matches = await prisma.lolResult.findMany({
      include: {
        teams: true
      }
    })

    return matches.map(({ tournamentFullName, tournamentImage, tournamentName, ...m }) => ({
      ...m,
      tournament: {
        name: tournamentName,
        image: tournamentImage
      }
    }))
  })
}