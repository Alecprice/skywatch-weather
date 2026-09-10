export const FORECAST_COORDINATE_POLICY = Object.freeze({
  minLatitude: -90,
  maxLatitude: 90,
  minLongitude: -180,
  maxLongitude: 180,
});

function parseCoordinate(raw: string | null, min: number, max: number): number | null {
  if (raw === null || raw.trim() === '') return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < min || value > max) return null;
  return value;
}

export function parseForecastCoordinates(latRaw: string | null, lonRaw: string | null): { lat: number; lon: number } | null {
  const lat = parseCoordinate(latRaw, FORECAST_COORDINATE_POLICY.minLatitude, FORECAST_COORDINATE_POLICY.maxLatitude);
  const lon = parseCoordinate(lonRaw, FORECAST_COORDINATE_POLICY.minLongitude, FORECAST_COORDINATE_POLICY.maxLongitude);
  return lat === null || lon === null ? null : { lat, lon };
}
