import type { FastifyInstance } from 'fastify'
import { prisma } from '../../database/prisma.ts'

export default function(fastify: FastifyInstance) {
  fastify.get('/results/valorant', {}, async() => {
    return await prisma.valResult.findMany({
      include: {
        teams: true
      }
    })
  })
}