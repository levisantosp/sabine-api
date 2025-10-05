import type { preHandlerMetaHookHandler } from 'fastify/types/hooks.js'

export const auth: preHandlerMetaHookHandler = (req, res, done) => {
  if(process.env.NODE_ENV === 'dev') return done()
    
  if(req.headers.authorization !== process.env.AUTH) {
    return res.status(401).send({ error: 'Forbidden' })
  }

  return done()
}