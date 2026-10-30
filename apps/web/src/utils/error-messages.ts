/**
 * File: error-messages.ts
 * Purpose: The one map from an error code to UI copy. Each message says what happened, then what to do.
 *          API errors (and the two client-side codes) go through getApiErrorMessage; run.error codes through RUN_ERROR_COPY.
 * Exports: formatRetryWait, getApiErrorMessage, RUN_ERROR_COPY
 * Used by: hooks and components that show an ApiError, components/run/run-copy.ts
 */
import type { RunErrorCode } from '@stamp/schema'
import type { ApiErrorKind } from '@/lib/api-error'
import { pluralize } from './plural'

const SECONDS_PER_MINUTE = 60

/** "42 seconds" up to a minute, then whole minutes rounded up. No wait given reads "a minute". */
export function formatRetryWait(seconds: number | null): string {
  if (seconds === null || seconds <= 0) return 'a minute'
  const whole = Math.ceil(seconds)
  if (whole < SECONDS_PER_MINUTE) return pluralize(whole, 'second')
  return pluralize(Math.ceil(whole / SECONDS_PER_MINUTE), 'minute')
}

const API_ERROR_COPY: Record<Exclude<ApiErrorKind, 'RATE_LIMITED'>, string> = {
  VALIDATION_ERROR: 'Stamp could not use that input. Check what you entered, then try again.',
  NOT_FOUND: 'Stamp could not find that. Check the address, or search for the app.',
  RUN_CAP_REACHED: 'Live generation is paused for today. Open a library guide instead.',
  INTERNAL: 'Something went wrong on our side. Try again in a moment.',
  NETWORK: 'Stamp could not reach the server. Check your connection, then try again.',
  INVALID_RESPONSE: 'Stamp got a reply it could not read. Try again, or reload the page.',
}

/** The message for a failed request. A 429 names the wait the API asked for. */
export function getApiErrorMessage(error: {
  code: ApiErrorKind
  retryAfter: number | null
}): string {
  if (error.code === 'RATE_LIMITED') {
    return `You have made too many requests. Try again in ${formatRetryWait(error.retryAfter)}.`
  }
  return API_ERROR_COPY[error.code]
}

/** Lead text for each run.error code, shown by the Live run page. */
export const RUN_ERROR_COPY: Record<RunErrorCode, string> = {
  AMBIGUOUS_APP: 'Stamp is not sure which app you mean. Choose the one you mean.',
  NOT_OAUTH:
    'This app uses API keys, not OAuth. Stamp covers provider OAuth apps only, so search for a different app.',
  NO_PUBLIC_DOCS:
    'Stamp found no public docs it can use. Contact the provider for setup details.',
  INTERNAL:
    'The run stopped because of an error on our side. Retry the run, or open a library guide.',
}
