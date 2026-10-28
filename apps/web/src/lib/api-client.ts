/**
 * File: api-client.ts
 * Purpose: The one Axios instance. Its interceptor turns every failure into an ApiError.
 * Exports: REQUEST_TIMEOUT_MS, apiClient
 * Used by: services/*
 */
import axios from 'axios'
import { API_BASE_URL } from './config'
import { toApiError } from './to-api-error'

export const REQUEST_TIMEOUT_MS = 15_000

// Only Content-Type and Accept are sent: the API's CORS policy allows no other request header.
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
})

apiClient.interceptors.response.use(undefined, (error: unknown) => {
  // A cancelled request is the caller's own abort (an unmount), not a failure to report.
  if (axios.isCancel(error)) return Promise.reject(error)
  return Promise.reject(toApiError(error))
})
