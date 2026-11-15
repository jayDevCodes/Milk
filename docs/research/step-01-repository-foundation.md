# Step 01 Research: Repository foundation and engineering rules

- Date checked: 2026-11-15
- Repository: https://github.com/jayDevCodes/Milk
- Starting commit: 0881c1695c1c50475cb5fbfff28435da778f52c8

## Live repository findings

The root initially held only README.md and docs/. The docs folder contained architecture, technology decisions, roadmap, offline-map strategy and AI development pipeline. There was no source code, Android Gradle project, backend package manifest, ignore/editor policy, env template, ADR index, contribution/security guide or CI workflow.

The README defines three separately installable apps and one shared backend. The architecture specifies application IDs and /api/v1. The previous pipeline required a second Build prompt after Research.

## Official GitHub guidance

- GitHub recommends checking Dependency graph, Dependabot alerts, secret scanning, push protection and code scanning. Their settings cannot be inferred from repository visibility: https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-security-and-analysis-settings-for-your-repository
- Dependabot version updates use .github/dependabot.yml with ecosystem, directory and schedule: https://docs.github.com/en/code-security/how-tos/secure-your-supply-chain/secure-your-dependencies/configure-version-updates
- GitHub Actions secure-use guidance recommends full-length immutable action commit SHAs when workflow dependency lockfiles are not in use, and least-privilege permissions: https://docs.github.com/en/actions/reference/security/secure-use
- actions/checkout v7.0.1 upstream commit was verified: https://github.com/actions/checkout/commit/3d3c42e5aac5ba805825da76410c181273ba90b1

## Options and decisions

| Concern | Option A | Option B | Decision |
|---|---|---|---|
| Repository checks | Add external linter stack immediately | Small Bash script | Choose B until app/backend toolchains exist |
| Dependency automation | Configure every ecosystem now | Actions now, Gradle/npm after manifests | Choose B |
| Action references | Mutable tags | Verified full commit SHA | Choose SHA |
| Token permissions | Broad defaults | Explicit contents: read | Choose least privilege |
| Progress tracking | Chat-only | Versioned state file | Choose state file |

## Implementation

- Preserve the monorepo/three-app/shared-backend architecture.
- Make Continue execute Research, Build, Verify and Commit for one step.
- Add root ignore/editor/environment conventions.
- Add contribution/security policy and three initial ADRs.
- Add pipeline state and a research record.
- Add a Bash repository guardrail and least-privilege GitHub Actions workflow.
- Configure Dependabot for GitHub Actions only; add Gradle/npm when manifests exist.

## Motion and limitations

No end-user motion is applicable to repository hygiene. UI motion will be researched during Step 2.

No credentials, production data or real locations are introduced. GitHub security settings cannot be changed or confirmed via repository file commits and must be checked by the maintainer. CI outcome remains pending until GitHub runs the workflow. No Gradle/npm/Docker/device checks exist yet because the apps/backend are not scaffolded.
