# Repository Development Workflow

TENX is the standard development workflow for this project.

## Workflow
1. Review repository state, recent pull requests, CI results, deployment/production evidence, and `.tenx/PROJECT.md`.
2. Verify current weather-provider, Next.js, Vercel, browser/API, security, and platform details from primary documentation when they affect the change.
3. Prioritize production failures first, then forecast/radar/alert correctness and reliability, then usability/features, then polish/refactoring.
4. Use a dedicated branch and keep each pull request focused on one coherent outcome.
5. Run `npx tsc --noEmit` and `npm run build` for code changes; GitHub CI must pass before merge.
6. For runtime-facing changes, verify the affected forecast/radar/alert/mobile flow in the deployed app when practical.
7. Pull requests should state the problem, implementation, verification, risks, and rollback path.
8. Update `.tenx/PROJECT.md` when priorities, critical flows, provider assumptions, or release assumptions materially change.

## Engineering rules
- Preserve working production behavior unless a task intentionally changes it.
- Prefer root-cause fixes with regression coverage when test infrastructure exists.
- Keep credentials, tokens, local secrets, and production data out of source control.
- Treat weather/alert correctness as higher priority than cosmetic work.

## Completion standard
Work is complete when the intended outcome is implemented, type/build gates pass or any failure is understood and documented, and runtime behavior is verified where practical.