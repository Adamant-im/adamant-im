import axios from 'axios'
import { getConnectionAwareTimeout } from '@/lib/network/connection'
import { logger } from '@/utils/devTools/logger'

export function createBtcLikeClient(url: string, requestTimeoutMs: number) {
  const client = axios.create({
    baseURL: url,
    timeout: getConnectionAwareTimeout(requestTimeoutMs)
  })

  client.interceptors.response.use(null, (error) => {
    if (error.response && Number(error.response.status) >= 500) {
      logger.log('create-btc-like-client', 'warn', 'Request failed', error)
    }
    return Promise.reject(error)
  })

  return client
}
