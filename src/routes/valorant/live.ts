import type { FastifyInstance } from 'fastify'
import { prisma } from '../../database/prisma.ts'

export default function(fastify: FastifyInstance) {
  fastify.get('/live/valorant', {}, async() => {
    return await prisma.valLiveMatch.findMany({
      include: {
        teams: true
      }
    })
  })
}