import apiClient from '../../../lib/adamant-api-client'

export default {
  list: apiClient.getNodes(),
  useFastest: false
}
