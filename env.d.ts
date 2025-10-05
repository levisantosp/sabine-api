declare global {
  namespace NodeJS {
    interface ProcessEnv {
      INTERVAL: number
      WEBHOOK_URL: string
      AUTH: string
      PANDA_TOKEN: string
      NODE_ENV?: 'dev' | 'prod'
    }
  }
}

export { }