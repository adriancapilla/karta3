#!/usr/bin/env bash
# B21: solo imagen comprobada y volúmenes efímeros, sin publicación/operación.
set -euo pipefail
proof="$RUNNER_TEMP/karta3-image"
prefix="karta3-b21-$GITHUB_RUN_ID-$GITHUB_RUN_ATTEMPT"
volume="$prefix-data"
restored="$prefix-restored"
human="$prefix-human"
secret="$prefix-secret"
app="$prefix-app"
cleanup_statistics() {
  status=$?
  if [ "$status" -ne 0 ]; then docker logs "$app" 2>&1 | grep -E '^(STATISTICS_|KARTA3:)' || true; fi
  docker rm -f "$app" >/dev/null 2>&1 || true
  docker volume rm "$volume" "$restored" "$human" "$secret" >/dev/null 2>&1 || true
}
trap cleanup_statistics EXIT
for name in "$volume" "$restored" "$human" "$secret"; do docker volume create "$name" >/dev/null; done
# Preparación explícita de archivo nuevo y clave fabricada; no lector/migración legacy.
docker run --rm --read-only --network none --mount "source=$volume,target=/var/lib/karta3/statistics" \
  -e KARTA3_ENV=test -e KARTA3_STATISTICS_DIRECTORY=/var/lib/karta3/statistics karta3:ci \
  node dist-server/server/composition/statisticsMaintenanceCli.js initialize
docker run --rm --read-only --network none --mount "source=$volume,target=/var/lib/karta3/statistics" karta3:ci \
  node -e "require('node:fs').writeFileSync('/var/lib/karta3/statistics/copy.key',require('node:crypto').randomBytes(32).toString('hex'),{flag:'wx',mode:0o600})"
start_statistics() {
  local readonly="${2:-}"
  docker run -d --name "$app" --init --read-only --tmpfs /tmp --network none \
    --mount "source=$volume,target=/var/lib/karta3/statistics${readonly:+,readonly}" \
    -e KARTA3_ENV=test -e "KARTA3_STATISTICS_MODE=$1" -e KARTA3_STATISTICS_DIRECTORY=/var/lib/karta3/statistics \
    -e KARTA3_STATISTICS_BACKUP_KEY_FILE=/var/lib/karta3/statistics/copy.key karta3:ci >/dev/null
  for attempt in {1..60}; do
    if docker exec "$app" node -e "fetch('http://127.0.0.1:3000/api/decks').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))" >/dev/null 2>&1; then return; fi
    sleep .25
  done
  return 1
}
probe() { docker exec -i -e "B21_PROBE=$1" "$app" node --input-type=module < tools/ci-statistics-runtime.mjs | tee "$proof/statistics-$1.json"; }
start_statistics synthetic
docker inspect "$app" | jq -e '.[0] | .HostConfig.ReadonlyRootfs and .Config.User == "node" and (.HostConfig.PortBindings | length) == 0 and .HostConfig.NetworkMode == "none"' >/dev/null
probe seed
docker stop --time 10 "$app" >/dev/null
test "$(docker inspect -f '{{.State.ExitCode}}' "$app")" = 0
docker rm "$app" >/dev/null
start_statistics off
probe after-stop
docker stop --time 10 "$app" >/dev/null
docker rm "$app" >/dev/null
start_statistics synthetic
probe seed
docker kill --signal KILL "$app" >/dev/null
docker rm "$app" >/dev/null
start_statistics off
probe after-kill
docker stop --time 10 "$app" >/dev/null
docker rm "$app" >/dev/null
start_statistics synthetic readonly
probe readonly-volume
docker stop --time 10 "$app" >/dev/null
docker rm "$app" >/dev/null
docker run --rm -i --read-only --tmpfs /tmp --network none \
  --mount "source=$restored,target=/var/lib/karta3/statistics" --mount "source=$volume,target=/source,readonly" \
  -e B21_PROBE=restore karta3:ci node --input-type=module < tools/ci-statistics-runtime.mjs | tee "$proof/statistics-restore.json"
docker run --rm --user 1001:1001 --read-only --network none --mount "source=$volume,target=/var/lib/karta3/statistics,readonly" \
  karta3:ci node -e "require('node:assert/strict').throws(()=>require('node:fs').readFileSync('/var/lib/karta3/statistics/test/synthetic/agg-daily-v1.sqlite'),{code:'EACCES'})"
docker run --rm --read-only --network none --mount "source=$secret,target=/var/lib/karta3/statistics" karta3:ci \
  node -e "require('node:fs').writeFileSync('/var/lib/karta3/statistics/copy.key',require('node:crypto').randomBytes(32).toString('hex'),{flag:'wx',mode:0o600})"
docker run --rm -i --read-only --tmpfs /tmp --network none \
  --mount "source=$human,target=/var/lib/karta3/statistics" --mount "source=$secret,target=/run/karta3-secrets,readonly" \
  karta3:ci node --input-type=module < tools/ci-statistics-human.mjs | tee "$proof/statistics-human-fabricated.json"
docker run --rm --user 1001:1001 --read-only --network none --mount "source=$human,target=/var/lib/karta3/statistics,readonly" \
  karta3:ci node -e "require('node:assert/strict').throws(()=>require('node:fs').readFileSync('/var/lib/karta3/statistics/pruebas/human/agg-daily-v1.sqlite'),{code:'EACCES'})"
