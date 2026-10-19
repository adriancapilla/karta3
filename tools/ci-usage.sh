#!/usr/bin/env bash
# Solo runner efímero: prueba la imagen YA construida, sin registro ni puertos.
set -euo pipefail
proof="$RUNNER_TEMP/karta3-image"
prefix="karta3-b18-$GITHUB_RUN_ID-$GITHUB_RUN_ATTEMPT"
volume="$prefix-data"
restored="$prefix-restored"
app="$prefix-app"
human="$prefix-human"
secret="$prefix-secret"
human_restored="$prefix-human-restored"
cleanup_usage() {
  status=$?
  if [ "$status" -ne 0 ]; then
    # Solo códigos de aplicación; no volcar DB, configuración, secretos o contexto.
    docker logs "$app" 2>&1 | grep -E '^(USAGE_|KARTA3:)' || true
  fi
  docker rm -f "$app" >/dev/null 2>&1 || true
  docker volume rm "$volume" "$restored" "$human" "$secret" "$human_restored" >/dev/null 2>&1 || true
}
trap cleanup_usage EXIT
docker volume create "$volume" >/dev/null
docker volume create "$restored" >/dev/null
start_usage() {
  local readonly="${2:-}"
  docker run -d --name "$app" --init --read-only --tmpfs /tmp --network none \
    --mount "source=$volume,target=/var/lib/karta3/usage${readonly:+,readonly}" \
    -e KARTA3_ENV=test -e "KARTA3_USAGE_COLLECTION=$1" -e KARTA3_USAGE_DIRECTORY=/var/lib/karta3/usage karta3:ci >/dev/null
  for attempt in {1..60}; do
    if docker exec "$app" node -e "fetch('http://127.0.0.1:3000/api/decks').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))" >/dev/null 2>&1; then return; fi
    sleep .25
  done
  return 1
}
probe() {
  docker exec -i -e "B18_PROBE=$1" "$app" node --input-type=module < tools/ci-usage-runtime.mjs | tee "$proof/usage-$1.json"
}
start_usage synthetic
docker inspect "$app" | jq -e '.[0] | .HostConfig.ReadonlyRootfs and .Config.User == "node" and (.HostConfig.PortBindings | length) == 0 and .HostConfig.NetworkMode == "none"' >/dev/null
probe seed
# Señal POSIX genuina al proceso node mediante init; parada anterior era IPC Windows.
docker stop --time 10 "$app" >/dev/null
test "$(docker inspect -f '{{.State.ExitCode}}' "$app")" = 0
docker rm "$app" >/dev/null
start_usage off
probe after-stop
docker stop --time 10 "$app" >/dev/null
docker rm "$app" >/dev/null
# Nuevo arranque sintético propio, corte abrupto y reconciliación sin duración inventada.
start_usage synthetic
probe seed
docker kill --signal KILL "$app" >/dev/null
docker rm "$app" >/dev/null
start_usage off
probe after-kill
docker stop --time 10 "$app" >/dev/null
docker rm "$app" >/dev/null
# Fallo real de almacenamiento: volumen entero read-only, el juego sigue sin recogida.
start_usage synthetic readonly
probe readonly-volume
docker stop --time 10 "$app" >/dev/null
docker rm "$app" >/dev/null
docker run --rm -i --read-only --tmpfs /tmp --network none \
  --mount "source=$restored,target=/var/lib/karta3/usage" --mount "source=$volume,target=/source,readonly" \
  -e KARTA3_ENV=test -e KARTA3_USAGE_COLLECTION=off -e KARTA3_USAGE_DIRECTORY=/var/lib/karta3/usage \
  -e B18_PROBE=restore karta3:ci node --input-type=module < tools/ci-usage-runtime.mjs | tee "$proof/usage-restore.json"
# Permiso negativo real: otro UID no puede leer el montaje privado.
docker run --rm --user 1001:1001 --read-only --network none --mount "source=$volume,target=/var/lib/karta3/usage,readonly" \
  karta3:ci node -e "require('node:assert/strict').throws(()=>require('node:fs').readFileSync('/var/lib/karta3/usage/test/synthetic/usage.sqlite'),{code:'EACCES'})"
printf '%s\n' '{"otherUidDenied":true,"collectionHumanEnabled":false,"publishedPorts":0,"syntheticVolumesRemovedOnExit":true}' > "$proof/usage-permissions.json"
# B19: servidor HUMAN exclusivamente fabricado por stdin, sin bandera pública de readiness.
for name in "$human" "$secret" "$human_restored"; do docker volume create "$name" >/dev/null; done
docker run --rm --read-only --network none --mount "source=$secret,target=/var/lib/karta3/usage" karta3:ci \
  node -e "require('node:fs').writeFileSync('/var/lib/karta3/usage/copy.key',require('node:crypto').randomBytes(32).toString('hex'),{flag:'wx',mode:0o600})"
# Inicializar propietario1000 del volumen de restauración antes de montarlo en /restore.
docker run --rm --read-only --network none --mount "source=$human_restored,target=/var/lib/karta3/usage" karta3:ci node -e "process.exit(0)"
docker run --rm -i --read-only --tmpfs /tmp --network none \
  --mount "source=$human,target=/var/lib/karta3/usage" --mount "source=$secret,target=/run/karta3-secrets,readonly" \
  --mount "source=$human_restored,target=/restore" \
  karta3:ci node --input-type=module < tools/ci-usage-human.mjs | tee "$proof/usage-b19-human.json"
docker run --rm --user 1001:1001 --read-only --network none --mount "source=$human,target=/var/lib/karta3/usage,readonly" \
  karta3:ci node -e "require('node:assert/strict').throws(()=>require('node:fs').readFileSync('/var/lib/karta3/usage/pruebas/human/usage.sqlite'),{code:'EACCES'})"
