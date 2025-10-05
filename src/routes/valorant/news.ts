import type { FastifyInstance } from 'fastify'
import { prisma } from '../../database/prisma.ts'

export default function(fastify: FastifyInstance) {
  fastify.get('/news/valorant', {}, async() => {
    return await prisma.news.findMany()
  })
}