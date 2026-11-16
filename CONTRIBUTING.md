# Contributing

Milk is one monorepo with three separately installable Android apps (Driver, Seller, Owner) and one shared backend. Read [Architecture](docs/ARCHITECTURE.md), [Roadmap](docs/IMPLEMENTATION_ROADMAP.md), and [AI development pipeline](docs/AI_DEVELOPMENT_PIPELINE.md).

## Required milestone cycle

1. Inspect the live repository and first incomplete roadmap step.
2. Research current official documentation and compatibility.
3. Save findings under docs/research before implementation.
4. Build only that milestone.
5. Run applicable tests, lint, type checks and builds; report checks not executable here.
6. Update docs/PIPELINE_STATE.md and commit.

**Continue** runs all six stages for one milestone. A separate Build prompt is not required.

Never commit credentials, signing keys, real driver/seller personal data, production database dumps, generated APK/AAB files or large regional map archives. Use scoped commits and never force-push shared work.
