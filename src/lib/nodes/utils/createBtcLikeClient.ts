import axios from 'axios'

export function createBtcLikeClient(url: string) {
  const client = axios.create({ baseURL: url, timeout: 10000 })

  client.interceptors.response.use(null, (error) => {
    if (error.response && Number(error.response.status) >= 500) {
      console.error('Request failed', error)
    }
    return Promise.reject(error)
  })

  return client
}
