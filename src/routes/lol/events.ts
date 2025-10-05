import type { FastifyInstance } from 'fastify'
import { prisma } from '../../database/prisma.ts'

export default function(fastify: FastifyInstance) {
  fastify.get('/events/lol', {}, async() => {
    return await prisma.lolEvent.findMany()
  })
}