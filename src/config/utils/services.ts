import { Service } from '@/types/wallets'
import { BlockchainSymbol, Config } from './types'
import config from '../index'

type ServiceNames<B extends BlockchainSymbol, S extends string = string> = Config[B] extends {
  services: Record<S, any>
}
  ? keyof Config[B]['services']
  : never

export function getService<B extends BlockchainSymbol, S extends ServiceNames<B>>(
  blockchain: B,
  serviceName: S
): Service[] {
  const blockchainConfig = config[blockchain]

  if ('services' in blockchainConfig) {
    const services = blockchainConfig['services']['list']
    const service = services[serviceName]

    if (service) {
      return service
    }
  }

  throw new Error(
    `${serviceName.toString()} service does not exist in "${blockchain}" configuration`
  )
}

export function getRandomServiceUrl<B extends BlockchainSymbol, S extends ServiceNames<B>>(
  blockchain: B,
  serviceName: S
): string {
  const serviceList = getService<B, S>(blockchain, serviceName)
  if (serviceList.length === 0) {
    throw new Error(`Missing services in "${blockchain}" configuration`)
  }

  const index = Math.floor(Math.random() * serviceList.length)
  const service = serviceList[index]

  return service.url
}
