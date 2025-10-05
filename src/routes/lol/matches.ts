import type { FastifyInstance } from 'fastify'
import { prisma } from '../../database/prisma.ts'

export default function(fastify: FastifyInstance) {
  fastify.get('/matches/lol', {}, async() => {
    return await prisma.lolMatch.findMany({
      include: {
        teams: true
      }
    })
  })
}