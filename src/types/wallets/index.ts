/* eslint-disable */
/* tslint:disable */
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface NodeInfo {
  url: string
  alt_ip?: string
  hasIndex?: boolean
}

export interface ProjectLink {
  name: string
  url: string
}

export interface Service {
  url: string
  alt_ip?: string
}

export interface TokenGeneral {
  /** Readable coin name */
  name: string
  /** Readable coin short name */
  nameShort?: string
  /** Project website URL */
  website: string
  /** Short description */
  description: string
  /** Explorer URL */
  explorer?: string
  /** URL to get tx info */
  explorerTx?: string
  /** URL to get address info */
  explorerAddress?: string
  /** URL to get contract info */
  explorerContract?: string
  /** RegEx to validate coin address */
  regexAddress?: string
  /** Research URL */
  research?: string
  /** Coin ticker */
  symbol: string
  /** Coin or token mainly */
  type: 'coin' | 'ERC20'
  /** Decimal places */
  decimals: number
  /** Max precision for tx */
  cryptoTransferDecimals: number
  /** Minimum acceptable amount for an address */
  minBalance?: number
  /** Minimum acceptable amount for tx */
  minTransferAmount?: number
  /** Fixed transfer fee */
  fixedFee?: number
  /** When the transfer fee is variable, but an app has not yet calculated it */
  defaultFee?: number
  /** QR code prefix for an address */
  qqPrefix?: string
  /** Should the coin be processed */
  status: 'active' | 'disabled'
  /** Should an app itself create the coin or only use the info for the blockchain */
  createCoin: boolean
  /** To show a coin by default, or hide it */
  defaultVisibility?: boolean
  /** Default ordinal number in a wallet list. Coins with the same ordinal number are sorted alphabetically. Coins without an order are shown last, alphabetically */
  defaultOrdinalLevel?: number
  /** Blockchain consensus type */
  consensus?: string
  /** Fixed block time in ms */
  blockTimeFixed?: number
  /** Average block time in ms */
  blockTimeAvg?: number
  txFetchInfo?: {
    /** Interval between fetching Tx in ms when its current status is "Pending" for new transactions */
    newPendingInterval?: number
    /** Interval between fetching Tx in ms when its current status is "Pending" for old transactions */
    oldPendingInterval?: number
    /** Interval between fetching Tx in ms when its current status is "Registered" */
    registeredInterval?: number
    /** Attempts to fetch Tx when its current status is "Pending" for new transactions */
    newPendingAttempts?: number
    /** Attempts to fetch Tx when its current status is "Pending" for old transactions */
    oldPendingAttempts?: number
  }
  /** Time in ms when difference between in-chat transfer and Tx timestamp considered as acceptable */
  txConsistencyMaxTime?: number
  /**
   * Minimal node API version
   * @example "0.8.0"
   */
  minNodeVersion?: string
  /** Node links for API */
  nodes?: NodeInfo[]
  services?: Record<string, Service>
  /** Additional project links */
  links?: ProjectLink[]
  tor?: {
    /** Project website URL (Tor) */
    website?: string
    /** Explorer URL (Tor) */
    explorer?: string
    /** URL to get tx info (Tor) */
    explorerTx?: string
    /** URL to get address info (Tor) */
    explorerAddress?: string
    /** Node links for API (Tor) */
    nodes?: NodeInfo[]
    services?: Record<string, Service>
    /** Additional project links (Tor) */
    links?: ProjectLink[]
  }
}

export interface TokenAsset {
  /** Readable coin name */
  name: string
  /** Coin ticker */
  symbol: string
  /** Should the coin be processed */
  status: 'active' | 'disabled'
  /** ID of contract */
  contractId: string
  /** To show a coin by default, or hide it */
  defaultVisibility?: boolean
  /** Default ordinal number in a wallet list. Coins with the same ordinal number are sorted alphabetically. Coins without an order are shown last, alphabetically */
  defaultOrdinalLevel?: number
  /** Decimal places */
  decimals: number
}

export interface Blockchain {
  /** Blockchain readable name */
  blockchain: string
  /** How an app should mark token blockchain */
  type: string
  /** A coin containing parameters common to the blockchain */
  mainCoin: string
  /** Coin to pay fees in */
  fees: string
  defaultGasLimit?: number
}

export type QueryParamsType = Record<string | number, any>
export type ResponseFormat = keyof Omit<Body, 'body' | 'bodyUsed'>

export interface FullRequestParams extends Omit<RequestInit, 'body'> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean
  /** request path */
  path: string
  /** content type of request body */
  type?: ContentType
  /** query params */
  query?: QueryParamsType
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseFormat
  /** request body */
  body?: unknown
  /** base url */
  baseUrl?: string
  /** request cancellation token */
  cancelToken?: CancelToken
}

export type RequestParams = Omit<FullRequestParams, 'body' | 'method' | 'query' | 'path'>

export interface ApiConfig<SecurityDataType = unknown> {
  baseUrl?: string
  baseApiParams?: Omit<RequestParams, 'baseUrl' | 'cancelToken' | 'signal'>
  securityWorker?: (
    securityData: SecurityDataType | null
  ) => Promise<RequestParams | void> | RequestParams | void
  customFetch?: typeof fetch
}

export interface HttpResponse<D extends unknown, E extends unknown = unknown> extends Response {
  data: D
  error: E
}

type CancelToken = Symbol | string | number

export enum ContentType {
  Json = 'application/json',
  FormData = 'multipart/form-data',
  UrlEncoded = 'application/x-www-form-urlencoded',
  Text = 'text/plain'
}

export class HttpClient<SecurityDataType = unknown> {
  public baseUrl: string = ''
  private securityData: SecurityDataType | null = null
  private securityWorker?: ApiConfig<SecurityDataType>['securityWorker']
  private abortControllers = new Map<CancelToken, AbortController>()
  private customFetch = (...fetchParams: Parameters<typeof fetch>) => fetch(...fetchParams)

  private baseApiParams: RequestParams = {
    credentials: 'same-origin',
    headers: {},
    redirect: 'follow',
    referrerPolicy: 'no-referrer'
  }

  constructor(apiConfig: ApiConfig<SecurityDataType> = {}) {
    Object.assign(this, apiConfig)
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data
  }

  protected encodeQueryParam(key: string, value: any) {
    const encodedKey = encodeURIComponent(key)
    return `${encodedKey}=${encodeURIComponent(typeof value === 'number' ? value : `${value}`)}`
  }

  protected addQueryParam(query: QueryParamsType, key: string) {
    return this.encodeQueryParam(key, query[key])
  }

  protected addArrayQueryParam(query: QueryParamsType, key: string) {
    const value = query[key]
    return value.map((v: any) => this.encodeQueryParam(key, v)).join('&')
  }

  protected toQueryString(rawQuery?: QueryParamsType): string {
    const query = rawQuery || {}
    const keys = Object.keys(query).filter((key) => 'undefined' !== typeof query[key])
    return keys
      .map((key) =>
        Array.isArray(query[key])
          ? this.addArrayQueryParam(query, key)
          : this.addQueryParam(query, key)
      )
      .join('&')
  }

  protected addQueryParams(rawQuery?: QueryParamsType): string {
    const queryString = this.toQueryString(rawQuery)
    return queryString ? `?${queryString}` : ''
  }

  private contentFormatters: Record<ContentType, (input: any) => any> = {
    [ContentType.Json]: (input: any) =>
      input !== null && (typeof input === 'object' || typeof input === 'string')
        ? JSON.stringify(input)
        : input,
    [ContentType.Text]: (input: any) =>
      input !== null && typeof input !== 'string' ? JSON.stringify(input) : input,
    [ContentType.FormData]: (input: any) =>
      Object.keys(input || {}).reduce((formData, key) => {
        const property = input[key]
        formData.append(
          key,
          property instanceof Blob
            ? property
            : typeof property === 'object' && property !== null
            ? JSON.stringify(property)
            : `${property}`
        )
        return formData
      }, new FormData()),
    [ContentType.UrlEncoded]: (input: any) => this.toQueryString(input)
  }

  protected mergeRequestParams(params1: RequestParams, params2?: RequestParams): RequestParams {
    return {
      ...this.baseApiParams,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...(this.baseApiParams.headers || {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {})
      }
    }
  }

  protected createAbortSignal = (cancelToken: CancelToken): AbortSignal | undefined => {
    if (this.abortControllers.has(cancelToken)) {
      const abortController = this.abortControllers.get(cancelToken)
      if (abortController) {
        return abortController.signal
      }
      return void 0
    }

    const abortController = new AbortController()
    this.abortControllers.set(cancelToken, abortController)
    return abortController.signal
  }

  public abortRequest = (cancelToken: CancelToken) => {
    const abortController = this.abortControllers.get(cancelToken)

    if (abortController) {
      abortController.abort()
      this.abortControllers.delete(cancelToken)
    }
  }

  public request = async <T = any, E = any>({
    body,
    secure,
    path,
    type,
    query,
    format,
    baseUrl,
    cancelToken,
    ...params
  }: FullRequestParams): Promise<HttpResponse<T, E>> => {
    const secureParams =
      ((typeof secure === 'boolean' ? secure : this.baseApiParams.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {}
    const requestParams = this.mergeRequestParams(params, secureParams)
    const queryString = query && this.toQueryString(query)
    const payloadFormatter = this.contentFormatters[type || ContentType.Json]
    const responseFormat = format || requestParams.format

    return this.customFetch(
      `${baseUrl || this.baseUrl || ''}${path}${queryString ? `?${queryString}` : ''}`,
      {
        ...requestParams,
        headers: {
          ...(requestParams.headers || {}),
          ...(type && type !== ContentType.FormData ? { 'Content-Type': type } : {})
        },
        signal: (cancelToken ? this.createAbortSignal(cancelToken) : requestParams.signal) || null,
        body: typeof body === 'undefined' || body === null ? null : payloadFormatter(body)
      }
    ).then(async (response) => {
      const r = response as HttpResponse<T, E>
      r.data = null as unknown as T
      r.error = null as unknown as E

      const data = !responseFormat
        ? r
        : await response[responseFormat]()
            .then((data) => {
              if (r.ok) {
                r.data = data
              } else {
                r.error = data
              }
              return r
            })
            .catch((e) => {
              r.error = e
              return r
            })

      if (cancelToken) {
        this.abortControllers.delete(cancelToken)
      }

      if (!response.ok) throw data
      return data
    })
  }
}

/**
 * @title Swagger Adamant-wallets
 * @version 1.0.0
 */
export class Api<SecurityDataType extends unknown> extends HttpClient<SecurityDataType> {}
