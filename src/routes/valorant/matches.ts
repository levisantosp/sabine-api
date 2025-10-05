import type { FastifyInstance } from 'fastify'
import { prisma } from '../../database/prisma.ts'

export default function(fastify: FastifyInstance) {
  fastify.get('/matches/valorant', {}, async() => {
    return await prisma.valMatch.findMany({
      include: {
        teams: true
      }
    })
  })
}