import config from '../config'

/**
 * Returns an endpoint for the desired system, picked randomly from the possible options (`config.json`)
 * @param {string} system system: one of `ADM` or `ETH`
 * @returns {string} endpoint URL
 */
export default function getEndpointUrl(system = '') {
  const endpoints = config.server[system.toLowerCase()] || []
  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)]

  return endpoint && endpoint.url
}
