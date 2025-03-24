declare global {
  namespace NodeJS {
    interface ProcessEnv {
      INTERVAL: number;
      WEBHOOK_URL: string;
      AUTH: string;
    }
  }
}
export {}