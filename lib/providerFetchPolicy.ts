export const WEATHER_PROVIDER_TIMEOUT_MS = 8_000;

export function createWeatherProviderSignal(timeoutMs = WEATHER_PROVIDER_TIMEOUT_MS): AbortSignal {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new RangeError('weather provider timeout must be positive and finite');
  }
  return AbortSignal.timeout(Math.floor(timeoutMs));
}
