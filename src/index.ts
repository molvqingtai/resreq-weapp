import compose from './compose'
import buildFullURL from './buildFullURL'

export type Meta = Record<string, any>
export type Header = Record<string, any>

export interface Cache {
  get: (req: Req) => Promise<Res | undefined> | Res | undefined
  set: (req: Req, value: Res) => Promise<void> | void
}

export interface Config extends Omit<UniNamespace.RequestOptions, 'data' | 'success' | 'fail' | 'complete' | 'url'> {
  baseURL?: string
  header?: Header
  meta?: Meta
}

export interface Request extends Omit<Config, 'baseURL'> {
  url: string
  params?: Record<string, any>
  body?: UniNamespace.RequestOptions['data']
  /** Get responses from cache first */
  cache?: Cache
}

export interface Req extends Request {
  header: Header
  meta: Meta
}

export interface Options extends Omit<Config, 'baseURL'> {
  params?: Record<string, any>
  body?: UniNamespace.RequestOptions['data']
  /** Get responses from cache first */
  cache?: Cache
}

export type Res = UniApp.RequestSuccessCallbackResult
export type Next = (req: Req) => Promise<Res>
export type Middleware = (next: Next) => (req: Req) => Promise<Res>

export default class Http {
  config: Config
  middleware: Middleware[] = []
  constructor(config: Config = {}) {
    this.config = {
      ...config,
      baseURL: config.baseURL ?? '',
      meta: config.meta ?? {}
    }
  }

  use(middleware: Middleware) {
    this.middleware = [...this.middleware, middleware]
    return this
  }

  adapter(request: Request): Promise<Res> {
    const isGetMethod = request.method === 'GET'
    const url = isGetMethod ? buildFullURL(request.url, '', request.params) : request.url
    return uni.request({
      ...request,
      url,
      data: request.body
    })
  }

  request<T = Res>(options: Request): Promise<T> {
    const { baseURL, header, meta } = this.config
    const dispatch = compose(...this.middleware)
    return dispatch(async (req) => {
      if (req?.cache?.get) {
        const res = await req.cache?.get(req)
        if (res !== undefined) {
          return res
        }
      }
      const res = await this.adapter(req)
      if (req?.cache?.set) {
        req.cache?.set(req, res)
      }
      return res
    })({
      ...this.config,
      ...options,
      url: buildFullURL(baseURL, options.url),
      method: options.method,
      header: { ...header, ...options.header },
      meta: { ...meta, ...options.meta }
    }) as Promise<T>
  }

  get<T = Res>(url: string, options?: Options) {
    return this.request<T>({ url, ...options, method: 'GET' })
  }

  post<T = Res>(url: string, options?: Options) {
    return this.request<T>({ url, ...options, method: 'POST' })
  }

  put<T = Res>(url: string, options?: Options) {
    return this.request<T>({ url, ...options, method: 'PUT' })
  }

  delete<T = Res>(url: string, options?: Options) {
    return this.request<T>({ url, ...options, method: 'DELETE' })
  }
}
