import type { FastifyInstance } from 'fastify'
import { prisma } from '../../database/prisma.ts'

export default function(fastify: FastifyInstance) {
  fastify.get('/results/lol', {}, async() => {
    return await prisma.lolResult.findMany({
      include: {
        teams: true
      }
    })
  })
}