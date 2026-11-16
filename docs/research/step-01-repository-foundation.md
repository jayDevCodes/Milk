# Step 01 Research and Build: Repository foundation

- Research checked: 2026-11-16
- Repository: https://github.com/jayDevCodes/Milk
- Implementation commit: 00057a063f902efb7cc0f31ab004970bd37b1334

## Baseline discovered

The live repository was not an empty documentation-only repository: it already contained three Android app modules, shared Compose app-shell/design/maps libraries, a MapLibre preview, Gradle configuration, a Step 2 research record and an Android CI workflow. This corrects the earlier stale pipeline checkpoint. Existing code was preserved.

## Research and decisions

- Keep one monorepo for three separately installable role apps and one shared backend.
- Add root ignore/editor/line-ending/environment-template conventions before introducing secrets or service configuration.
- Keep generated APK/AAB, signing material, local environment files and large regional map archives out of normal Git history.
- Keep GitHub Actions token permissions read-only and use immutable commit references for third-party actions.
- Track progress in a versioned state file; docs alone do not prove implementation.
- Use a lightweight repository guardrail script rather than adding another dependency before the Android/backend toolchains are stable.
- Dependabot currently tracks GitHub Actions only. Add Gradle and npm ecosystems when backend and dependency manifests are present.

## Sources reviewed

- GitHub security and analysis settings: https://docs.github.com/en/code-security/getting-started/github-security-features
- Dependabot version updates: https://docs.github.com/en/code-security/dependabot/dependabot-version-updates
- GitHub Actions secure use: https://docs.github.com/en/actions/reference/security/secure-use
- actions/checkout v7.0.1 immutable release commit: https://github.com/actions/checkout/commit/3d3c42e5aac5ba805825da76410c181273ba90b1

## Build delivered

Commit 00057a063f902efb7cc0f31ab004970bd37b1334 added repository hygiene files, contributor/security guidance, autonomous pipeline instructions, ADRs and the pipeline state register.

## Verification

- Repository guardrails workflow for commit 00057a0: SUCCESS. https://github.com/jayDevCodes/Milk/actions/runs/43794466381
- Shell guardrail job confirmed all required files and tracked assets checks passed.
- GitHub Advanced Security feature toggles were not verifiable through the available repository API; maintainer confirmation remains required.
- No local Android build or physical-device validation was executed in this step.

## Acceptance

Step 1 remains PARTIAL until the maintainer verifies repository security settings. The automated repository hygiene workflow is passing.
