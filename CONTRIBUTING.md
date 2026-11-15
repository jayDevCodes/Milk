# Contributing to Milk

Milk is one monorepo with three separately installable Android apps and one shared backend. Read docs/ARCHITECTURE.md, docs/IMPLEMENTATION_ROADMAP.md and docs/AI_DEVELOPMENT_PIPELINE.md before changing system boundaries.

## Development cycle

1. Inspect the live repository and first incomplete roadmap step.
2. Research official docs, stable versions, compatibility and alternatives.
3. Save findings under docs/research/ before implementation.
4. Build only the selected roadmap step.
5. Run checks for changed modules and record checks requiring CI or a physical device.
6. Update docs/PIPELINE_STATE.md and commit.

The normal assistant command is **Continue**. It runs Research, Build, Verify and Commit for one milestone; no separate Build prompt is needed.

## Boundaries

- android/apps/driver, android/apps/seller and android/apps/owner contain role-specific Android code.
- Shared Android modules contain only genuinely reusable code.
- backend/ contains the single modular API and database migrations.
- docs/ contains architecture, ADRs, research, runbooks and pipeline state.
- Keep API contracts and migrations versioned.
- Do not split the three apps into separate repositories.

## Branches and commits

Use branches such as feat/step-NN-topic, fix/topic, docs/topic or chore/topic for parallel work. Use scoped Conventional Commit messages such as chore(repo): add guardrails. Keep changes reviewable and never force-push shared work.

## Checks

Run:

    bash scripts/check-repository.sh

As modules are added, run their formatter, lint, type-check, unit/integration tests and build commands. Record actual outcomes.

## Secrets and generated files

Never commit credentials, signing keys, service-account JSON, real seller/driver data or production database exports. Keep local environment files out of Git. Do not commit APK/AAB, large OSM PBF, PMTiles or Valhalla artifacts. Use approved, versioned release assets after checking licences and checksums. Report security vulnerabilities privately.
