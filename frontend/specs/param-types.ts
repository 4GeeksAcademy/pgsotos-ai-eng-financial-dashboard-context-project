/**
 * Query-parameter types for the three PM features. Names, defaults and limits
 * were verified against the backend OpenAPI schema (see `api-exploration.md`).
 * Where the PM brief is stricter than the API, the stricter rule is documented
 * here as a UI rule. This file is a specification only.
 */

import type { BusinessType, OperationType } from "./api-types";

/** Aggregation window used by the summary and alerts endpoints. */
export type GroupBy = "day" | "week" | "month";

/** Optional date range shared by every filtered endpoint. */
export interface DateRangeFilter {
  /** Inclusive start date. Format `YYYY-MM-DD`. When omitted the range starts at the oldest movement. Must not be later than `end_date` (the API does not check it: it returns empty results). */
  start_date?: string;
  /** Inclusive end date. Format `YYYY-MM-DD`. When omitted the range ends at the most recent movement. An invalid date makes the API answer HTTP 422. */
  end_date?: string;
}

/** Query parameters of `GET /api/metrics/alerts`. */
export interface AlertsParams extends DateRangeFilter {
  /**
   * Minimum increase ratio over the baseline that triggers an alert. The API
   * default is `0.3` and it accepts any value `>= 0` (negative values answer HTTP 422).
   * UI rule from the PM brief: only allow `0.01` to `1.0`.
   */
  threshold?: number;
  /** Period size. API default `month`. The specification fixes it to `month`. */
  group_by?: GroupBy;
  /** Restricts the alerts to one business line. Omitted means both. */
  business_type?: BusinessType;
}

/** Query parameters of `GET /api/metrics/categories/top`. */
export interface TopCategoriesParams extends DateRangeFilter {
  /** Operation type to rank. The API default is `outcome`: send `income` explicitly for revenue tables. */
  operation_type?: OperationType;
  /** Maximum number of rows. Integer from 1 to 20 (otherwise HTTP 422). API default `5`. */
  limit?: number;
  /** Restricts the ranking to one business line. Omitted means both. */
  business_type?: BusinessType;
}
