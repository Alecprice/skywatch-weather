# SkyWatch Weather Project State

Product: weather SPA covering forecasts, radar, alerts, outdoor planning, air/pollen, storm center, and settings.

Priorities:
- P0: production outage, failed deploy/CI, broken weather/alert data path.
- P1: incorrect/stale forecast or alert behavior, radar failures, mobile usability, reliability.
- P2: forecast/planning/air-quality/storm-center features.
- P3: polish and refactors.

Critical release checks:
- `npx tsc --noEmit`
- `npm run build`
- GitHub CI passes
- Affected forecast/radar/alert flow verified in the deployed app when practical

Tracked work should live in GitHub Issues and pull requests. Update this file when priorities, provider assumptions, or release assumptions materially change.