/**
 * File: runs.service.ts
 * Purpose: POST /api/runs (cached slug, or a started or joined run) and GET /api/runs/:id (snapshot).
 * Exports: createRun, getRun
 * Used by: hooks/useStartRun.ts, services/run-stream.service.ts
 */
import {
  RunSnapshotSchema,
  StartRunResultSchema,
  type RunSnapshot,
  type StartRunInput,
  type StartRunResult,
} from '@stamp/schema'
import { apiClient } from '@/lib/api-client'
import { parseResponse } from '@/lib/parse-response'

/** `cached` carries a slug; `started` and `running` carry a run id. `force` skips the cache. */
export async function createRun(
  input: StartRunInput,
  signal?: AbortSignal,
): Promise<StartRunResult> {
  const { data } = await apiClient.post<unknown>('/api/runs', input, { signal })
  return parseResponse(StartRunResultSchema, data)
}

/** A run's snapshot. An unknown id rejects with ApiError code NOT_FOUND. */
export async function getRun(runId: string, signal?: AbortSignal): Promise<RunSnapshot> {
  const { data } = await apiClient.get<unknown>(`/api/runs/${encodeURIComponent(runId)}`, {
    signal,
  })
  return parseResponse(RunSnapshotSchema, data)
}
