import { error } from './logger.ts'

export default async function(data: any[], path: string) {
  try {
    await fetch(process.env.WEBHOOK_URL + path, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
  }
  catch(e) {
    error(e as Error)
  }
}