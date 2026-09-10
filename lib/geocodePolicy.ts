const MAX_GEOCODE_QUERY_LENGTH = 120;
const MAX_GEOCODE_RESULTS = 8;

export function normalizeGeocodeQuery(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const query = value.trim();
  if (query.length < 2 || query.length > MAX_GEOCODE_QUERY_LENGTH) return null;
  return query;
}

export function normalizeGeocodeResults(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === 'object' && !Array.isArray(row))
    .slice(0, MAX_GEOCODE_RESULTS);
}

export const GEOCODE_POLICY = Object.freeze({
  maxQueryLength: MAX_GEOCODE_QUERY_LENGTH,
  maxResults: MAX_GEOCODE_RESULTS,
});
