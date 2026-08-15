# SkyWatch Weather 2.0

A production-minded single-page weather application built with **Next.js 16 + React 19**. It combines normal forecasts, extended-range ensemble guidance, live radar, official severe-weather alerts, outdoor-event monitoring, health/environment data, and optional background notification infrastructure.

## Included features

- Forecast horizons: 6 hr, 12 hr, 24 hr, 2 day, 3 day, 5 day, 7 day, 14 day, 24 day, and 1 month.
- Short-range hourly + standard daily forecast using Open-Meteo.
- 24-day / 1-month extended ensemble guidance with clear uncertainty labeling.
- Forecast-confidence scores using ensemble spread when available, with a conservative fallback.
- Animated live radar with RainViewer tiles.
- Optional verified lightning overlay via `LIGHTNING_FEED_URL`.
- Optional NASA FIRMS active-fire hotspot overlay via `FIRMS_MAP_KEY`.
- Official U.S. NWS watches/warnings/advisories by geographic point.
- Automatic Storm Mode banner for Severe/Extreme NWS alerts.
- NOAA/NHC current tropical-storm center.
- Snow/ice hazard summary.
- AQI, PM2.5, PM10, ozone, aerosol/dust signal, and pollen forecasts (CAMS in Europe; optional `POLLEN_FEED_URL` elsewhere).
- Smart “best outdoor window” engine.
- Activity presets: baseball, soccer, wedding, cookout, fishing, hiking, mowing, farm work, construction, pool day, and general outdoor.
- Saved outdoor plans with thresholds for temperature, rain, and wind.
- Forecast-change history for saved event dates.
- Rain-start/rain-stop short-range guidance.
- Multi-location saving and fast switching.
- Calendar import from `.ics` plus Google Calendar, Outlook, and Apple/ICS event export.
- Stateless shareable event-status URLs at `/share/<token>` — no database required for sharing.
- PWA manifest, offline shell caching, service worker, browser notifications, and Web Push receiver.
- Optional production background Web Push using VAPID.
- Optional Resend email and Twilio SMS channels.
- Quiet hours for non-critical notifications; Severe/Extreme official alerts bypass quiet hours.
- Vercel Cron endpoint that checks severe alerts, saved-plan changes, and rain-start transitions every 15 minutes.
- Vercel KV / Upstash REST durable storage, with `/tmp` development fallback.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

The core app works without credentials. Optional provider-backed features become available as you configure them.

## Production notification setup

1. Generate VAPID keys (for example with the `web-push` CLI) and set `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `VAPID_SUBJECT`.
2. Add Vercel KV / Upstash Redis REST credentials using `KV_REST_API_URL` + `KV_REST_API_TOKEN` (or the Upstash-prefixed equivalents).
3. Deploy to Vercel. `vercel.json` schedules `/api/cron/monitor` every 15 minutes.
4. Optionally configure Resend and/or Twilio for email/SMS channels.
5. Enable notifications in the app. The browser push subscription is registered and the user's plans/preferences are synced to the monitor store.

See `.env.example` for every variable.

## Lightning

SkyWatch deliberately does **not** pretend that a thunderstorm forecast equals a detected lightning strike. To activate true proximity alerts, set `LIGHTNING_FEED_URL` to a provider/proxy that accepts `lat` and `lon` query parameters and returns standardized JSON with `nearestMiles` and/or a `strikes` array containing latitude/longitude/time.

## Wildfire / smoke

- Smoke/haze awareness works immediately from Open-Meteo/CAMS particulate and aerosol data.
- Near-real-time fire points are enabled with a free NASA FIRMS `FIRMS_MAP_KEY`. The app queries a regional bounding box around the current location and renders VIIRS NOAA-21 NRT detections on the radar map.

## Calendar support

The app does not require OAuth for the default calendar workflow:

- Import future events from `.ics` exports produced by Apple, Google, Outlook, and many other calendars.
- Add an individual SkyWatch plan directly to Google Calendar or Outlook via their event-compose URLs.
- Download a standards-based `.ics` file for Apple Calendar or any other calendar client.

A future OAuth sync can be layered on top if continuous two-way calendar synchronization is needed.

## Data providers

- Open-Meteo Weather Forecast API — normal forecast.
- Open-Meteo Seasonal / EC46 guidance — extended range.
- Open-Meteo Ensemble API — confidence/model spread.
- Open-Meteo Air Quality API — AQI, particulate matter, aerosols, and pollen.
- National Weather Service API — official U.S. alerts.
- NOAA National Hurricane Center — current tropical systems.
- RainViewer — radar animation for this build.
- NASA FIRMS — optional satellite fire hotspots.

Review each provider's license and commercial-use terms before a commercial launch. In particular, replace or license the radar provider appropriately for a high-volume commercial product.

## Architecture notes

This uses the Next.js App Router but behaves as an SPA after load. Client-side views manage the interactive dashboard; server route handlers proxy/cache weather providers and keep provider credentials off the client. Push monitoring is intentionally separated into a cron route so the app can alert users even after the page is closed.

## Safety

SkyWatch is a decision-support weather interface, not an emergency authority. Official NWS/NHC instructions take precedence over model guidance, radar interpretation, event scores, or confidence estimates.
