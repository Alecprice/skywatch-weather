# SkyWatch 2.0 feature status

| Feature | Status | Notes |
|---|---|---|
| 6/12/24-hour forecasts | Ready | Detailed hourly forecast |
| 2/3/5/7/14-day forecasts | Ready | Daily local forecast |
| 24-day / 1-month guidance | Ready | Extended ensemble guidance, clearly labeled |
| Live animated radar | Ready | RainViewer provider module |
| Severe weather alerts | Ready | Official NWS active alerts by point |
| Outdoor date monitoring | Ready | Activity-specific thresholds and risk scoring |
| Best outdoor window | Ready | Scans next 72 hours |
| Forecast confidence | Ready | Ensemble-spread route with conservative fallback |
| Calendar import | Ready | ICS from Google/Apple/Outlook/etc. |
| Calendar export | Ready | Google, Outlook, Apple/ICS |
| Activity profiles | Ready | 11 presets |
| Storm Mode | Ready | Severe/Extreme alert banner + emergency-oriented view |
| Multi-location | Ready | Local saved locations and quick switching |
| Rain start/stop guidance | Ready | Short-range transition detection |
| Rain start/stop background alerts | Ready with production notification config | Cron worker |
| Forecast-change history | Ready | Local snapshots with old → new values |
| Shared event status pages | Ready | Stateless encoded share URLs |
| AQI / PM / ozone | Ready | Open-Meteo/CAMS |
| Smoke/haze signal | Ready | PM + aerosol indicators |
| Pollen | Europe ready; elsewhere provider hook | `POLLEN_FEED_URL` for U.S./regional provider |
| Snow/ice mode | Ready | Accumulation and freezing-precipitation risk in Storm Center |
| Tropical tracker | Ready | NOAA/NHC `CurrentStorms.json` |
| Wildfire hotspots | Ready with free FIRMS key | `FIRMS_MAP_KEY` |
| Lightning proximity | Ready with verified provider | `LIGHTNING_FEED_URL` |
| Web Push | Ready with VAPID | Service worker + push subscription + cron delivery |
| Email alerts | Ready with Resend | Optional |
| SMS alerts | Ready with Twilio | Optional |
| Quiet hours | Ready | Severe/Extreme alerts bypass quiet hours |
| Installable PWA | Ready | Manifest + offline shell + service worker |
| Homescreen quick actions | Ready where supported | Forecast, Radar, Plans, Alerts shortcuts |
| Native OS homescreen widget | Not a standard cross-platform PWA capability | Would require platform-specific native wrapper/app |
| Durable background monitor storage | Ready with Vercel KV / Upstash | `/tmp` fallback for local development |
| Scheduled monitor | Ready | `vercel.json` runs every 15 minutes |
