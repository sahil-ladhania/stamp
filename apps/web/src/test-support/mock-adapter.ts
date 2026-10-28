/**
 * File: mock-adapter.ts
 * Purpose: Test helper. Swaps the Axios adapter on apiClient so a test records every request and controls the
 *          reply. No network, no server.
 * Exports: MockReply, RecordedCall, installMockAdapter
 * Used by: lib/*.test.ts, services/*.test.ts
 */
import axios, {
  AxiosError,
  type AxiosAdapter,
  type InternalAxiosRequestConfig,
} from 'axios'
import { apiClient } from '@/lib/api-client'

export type MockReply =
  | { status: number; data?: unknown; headers?: Record<string, string> }
  | { failure: 'network' | 'timeout' | 'cancel' }

export type RecordedCall = {
  method: string
  url: string
  /** The parsed JSON body, or undefined for a request without one. */
  body: unknown
  baseURL: string | undefined
  timeout: number | undefined
  headers: Record<string, unknown>
}

function record(config: InternalAxiosRequestConfig): RecordedCall {
  return {
    method: (config.method ?? 'get').toLowerCase(),
    url: config.url ?? '',
    body: typeof config.data === 'string' ? JSON.parse(config.data) : config.data,
    baseURL: config.baseURL,
    timeout: config.timeout,
    headers: { ...config.headers.toJSON() },
  }
}

function failureError(
  failure: 'network' | 'timeout' | 'cancel',
  config: InternalAxiosRequestConfig,
): Error {
  if (failure === 'cancel') return new axios.CanceledError('canceled', config)
  if (failure === 'timeout') {
    return new AxiosError('timeout of 15000ms exceeded', AxiosError.ECONNABORTED, config)
  }
  return new AxiosError('Network Error', AxiosError.ERR_NETWORK, config)
}

/** Every request gets `reply` (or the result of calling it). Call `restore` in afterEach. */
export function installMockAdapter(reply: MockReply | ((call: RecordedCall) => MockReply)): {
  calls: RecordedCall[]
  restore: () => void
} {
  const calls: RecordedCall[] = []
  const original = apiClient.defaults.adapter

  const adapter: AxiosAdapter = async (config) => {
    const call = record(config)
    calls.push(call)
    const next = typeof reply === 'function' ? reply(call) : reply
    if ('failure' in next) throw failureError(next.failure, config)

    const response = {
      data: next.data,
      status: next.status,
      statusText: '',
      headers: next.headers ?? {},
      config,
    }
    if (config.validateStatus?.(next.status) !== false) return response
    const code = next.status >= 500 ? AxiosError.ERR_BAD_RESPONSE : AxiosError.ERR_BAD_REQUEST
    throw new AxiosError(`Request failed with status code ${next.status}`, code, config, null, response)
  }

  apiClient.defaults.adapter = adapter
  return {
    calls,
    restore: () => {
      apiClient.defaults.adapter = original
    },
  }
}
