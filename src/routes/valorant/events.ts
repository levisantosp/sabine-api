import type { FastifyInstance } from 'fastify'
import { prisma } from '../../database/prisma.ts'

export default function(fastify: FastifyInstance) {
  fastify.get('/events/valorant', {}, async() => {
    return await prisma.valEvent.findMany()
  })
}