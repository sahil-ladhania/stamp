/**
 * File: index.ts
 * Purpose: Public entry for shared Zod schemas and inferred types used by web and API.
 * Exports: all @stamp/schema contracts
 * Used by: apps/web, apps/api
 */
export * from "./claim.js";
export * from "./constants.js";
export * from "./enums.js";
export * from "./errors.js";
export * from "./events.js";
export * from "./guide/index.js";
export * from "./api/runs.js";
export * from "./api/guides.js";

/** @deprecated Use StartRunInputSchema — kept for transitional imports. */
export { StartRunInputSchema as startRunInputSchema } from "./api/runs.js";
/** @deprecated Use StartRunResultSchema */
export { StartRunResultSchema as startRunResultSchema } from "./api/runs.js";
/** @deprecated Use RunStatusSchema */
export { RunStatusSchema as runStatusSchema } from "./enums.js";
/** @deprecated Use RunSnapshotSchema */
export { RunSnapshotSchema as runSnapshotSchema } from "./api/runs.js";
/** @deprecated Use GuideSummarySchema */
export { GuideSummarySchema as guideSummarySchema } from "./guide/guide.js";
/** @deprecated Use GuideSchema */
export { GuideSchema as guideSchema } from "./guide/guide.js";
/** @deprecated Use CreateClaimReportInputSchema */
export {
  CreateClaimReportInputSchema as createClaimReportInputSchema,
} from "./api/guides.js";
/** @deprecated Use CreateClaimReportResultSchema */
export {
  CreateClaimReportResultSchema as createClaimReportResultSchema,
} from "./api/guides.js";
/** @deprecated Use ApiErrorCodeSchema */
export { ApiErrorCodeSchema as apiErrorCodeSchema } from "./enums.js";
/** @deprecated Use ApiErrorBodySchema */
export { ApiErrorBodySchema as apiErrorBodySchema } from "./errors.js";
/** @deprecated Use RunStreamEventSchema */
export { RunStreamEventSchema as runStreamEventSchema } from "./events.js";
/** @deprecated Use RunErrorCodeSchema */
export { RunErrorCodeSchema as runErrorCodeSchema } from "./enums.js";
