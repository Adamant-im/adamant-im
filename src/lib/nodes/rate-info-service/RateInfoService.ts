import { Node } from '@/lib/nodes/abstract.node'
import axios, { AxiosInstance } from 'axios'
import { HealthcheckResult } from '@/lib/nodes/types.ts'
import { NODE_LABELS } from '@/lib/nodes/constants.ts'

export type RateInfoResponse = {
  success: boolean
  date: number
  result: Record<string, number>
}

export type RateHistoryInfoResponse = {
  success: boolean
  date: number
  result: {
    _id: string
    date: number
    tickers: Record<string, number>
  }[]
}

export class RateInfoService extends Node<AxiosInstance> {
  constructor(url: string) {
    super(url, 'adm', 'service', NODE_LABELS.Rate)
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

  async getHistory(timestamp: number) {
    const response = await this.client.get<RateHistoryInfoResponse>(
      `/getHistory?timestamp=${timestamp}`
    )
    return response.data
  }

  protected async checkHealth(): Promise<HealthcheckResult> {
    const start = Date.now()
    const response = await this.getAllRates()
    return {
      ping: Date.now() - start,
      height: response.date
    }
  }
}
