#!/usr/bin/env bash
set -euo pipefail
root="$(git rev-parse --show-toplevel)"
cd "$root"
failures=0
required=(README.md CONTRIBUTING.md SECURITY.md .gitignore .editorconfig .gitattributes .env.example docs/ARCHITECTURE.md docs/IMPLEMENTATION_ROADMAP.md docs/AI_DEVELOPMENT_PIPELINE.md docs/PIPELINE_STATE.md docs/adr/README.md)
for file in "${required[@]}"; do
  if [[ ! -f "$file" ]]; then
    printf '::error file=%s::Required file is missing\n' "$file"
    failures=$((failures + 1))
  fi
done
while IFS= read -r -d '' path; do
  name="${path##*/}"
  case "$name" in
    .env) printf '::error file=%s::Do not track environment files\n' "$path"; failures=$((failures + 1)) ;;
    .env.*) if [[ "$name" != ".env.example" ]]; then printf '::error file=%s::Only .env.example may be tracked\n' "$path"; failures=$((failures + 1)); fi ;;
  esac
  case "$path" in
    *.apk|*.aab|*.jks|*.keystore|*.p12|*.pfx|*.pbf|*.pmtiles|*.mbtiles|valhalla_tiles/*|*/valhalla_tiles/*)
      printf '::error file=%s::Generated or signed asset must not be tracked\n' "$path"
      failures=$((failures + 1)) ;;
  esac
done < <(git ls-files -z)
if (( failures > 0 )); then
  printf 'Repository guardrails failed: %s issue(s).\n' "$failures"
  exit 1
fi
printf 'Repository guardrails passed.\n'
