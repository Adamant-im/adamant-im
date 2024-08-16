import { Node } from '@/lib/nodes/abstract.node'
import axios, { AxiosInstance } from 'axios'
import { HealthcheckResult } from '@/lib/nodes/types'
import { NODE_LABELS } from '@/lib/nodes/constants'
import { RateInfoResponse } from '@/lib/nodes/rate-info-service/types/RateInfoResponse'
import { RateHistoryInfoResponse } from '@/lib/nodes/rate-info-service/types/RateHistoryInfoResponse'
import { GetHistoryParams } from '@/lib/nodes/rate-info-service/types/GetHistoryParams'
import { normalizeHeight } from './utils'

export class RateInfoService extends Node<AxiosInstance> {
  constructor(url: string) {
    super(url, 'adm', 'service', NODE_LABELS.RatesInfo)
  }
  protected buildClient(): AxiosInstance {
    return axios.create({
      baseURL: this.url
    })
  }

  async getAllRates(): Promise<RateInfoResponse> {
    const response = await this.client.get<RateInfoResponse>('/get')
    return response.data
  }

  async getHistory(options: GetHistoryParams) {
    const response = await this.client.get<RateHistoryInfoResponse>(`/getHistory`, {
      params: options
    })
    return response.data
  }

  protected async checkHealth(): Promise<HealthcheckResult> {
    const start = Date.now()
    const response = await this.getAllRates()
    this.height = normalizeHeight(response.date)
    return {
      ping: Date.now() - start,
      height: this.height
    }
  }
}
