#!/usr/bin/env bash
# Solo runner efímero: no registro externo, credenciales ni operaciones de VPS.
set -euo pipefail
[[ "$CHECKED_SHA" =~ ^[0-9a-f]{40}$ ]]
test "$(git rev-parse HEAD)" = "$CHECKED_SHA"
test ! -e deploy/.env.private
proof="$RUNNER_TEMP/karta3-image"
mkdir -p "$proof"
export COMPOSE_PROJECT_NAME="karta3-ci-$GITHUB_RUN_ID-$GITHUB_RUN_ATTEMPT"
export KARTA3_IMAGE=karta3:ci KARTA3_DOMAIN=localhost NODE_ENV=production KARTA3_ENV=test
export CADDY_IMAGE
CADDY_IMAGE=$(sed -n 's/^CADDY_IMAGE=//p' deploy/.env.example | tr -d '\r')
compose() { docker compose -f deploy/compose.yaml -f deploy/compose.usage.yaml "$@"; }
cleanup() {
  status=$?
  if [ "$status" -ne 0 ]; then compose logs --tail=100 app caddy || true; fi
  # Exclusivamente el proyecto/volúmenes de este runner; nunca Pruebas/VPS.
  compose down --volumes || true
}
trap cleanup EXIT
started=$(date -u +%FT%TZ)
docker version
docker compose version
docker buildx version
skopeo --version
docker buildx build --platform linux/amd64 --provenance=false --sbom=false \
  --build-arg "VCS_REF=$CHECKED_SHA" --progress=plain \
  --output "type=oci,dest=$proof/karta3.oci.tar" .
# Se prueba el archivo exportado, sin reconstrucción ni envío a un registro.
skopeo inspect --raw "oci-archive:$proof/karta3.oci.tar" > "$proof/manifest.json"
manifest_digest="sha256:$(sha256sum "$proof/manifest.json" | cut -d ' ' -f1)"
test "$manifest_digest" = "$(tar -xOf "$proof/karta3.oci.tar" index.json | jq -r '.manifests[0].digest')"
config_digest=$(jq -r '.config.digest' "$proof/manifest.json")
skopeo copy "oci-archive:$proof/karta3.oci.tar" docker-daemon:karta3:ci
docker image inspect karta3:ci > "$proof/image.json"
jq -e --arg sha "$CHECKED_SHA" --arg config "$config_digest" \
  '.[0] | .Os == "linux" and .Architecture == "amd64" and .Id == $config
    and .Config.User == "node" and .Config.Labels["org.opencontainers.image.revision"] == $sha' "$proof/image.json"
compose config --quiet
compose up -d --wait --wait-timeout 120
app=$(compose ps -q app)
caddy=$(compose ps -q caddy)
test "$(compose ps -q app | wc -l)" -eq 1
docker inspect "$app" > "$proof/container.json"
jq -e '.[0] | .State.Health.Status == "healthy" and .HostConfig.ReadonlyRootfs
  and (.HostConfig.PortBindings | length) == 0 and (.NetworkSettings.Networks | length) == 1' "$proof/container.json"
network=$(jq -r '.[0].NetworkSettings.Networks | keys[0]' "$proof/container.json")
docker network inspect "$network" | jq -e '.[0].Internal == true'
docker inspect "$caddy" | jq -e '.[0] | .HostConfig.PortBindings | keys | sort == ["443/tcp", "80/tcp"]'
docker exec -i "$app" node --input-type=module < tools/ci-image-runtime.mjs | tee "$proof/runtime.json"
ca_ready=false
for attempt in {1..60}; do
  if compose cp caddy:/data/caddy/pki/authorities/local/root.crt "$proof/local-ca.crt"; then ca_ready=true; break; fi
  sleep 0.5
done
test "$ca_ready" = true
wait_tls() {
  for attempt in {1..60}; do
    if curl --fail --silent --cacert "$proof/local-ca.crt" https://localhost/api/decks > "$proof/catalog.json"; then return; fi
    sleep 0.5
  done
  return 1
}
wait_tls
export KARTA3_BASE_URL=https://localhost KARTA3_HTTP_BASE_URL=http://localhost KARTA3_TEST_INSECURE_TLS=1
# La CA es exclusiva de este ensayo; curl verifica certificado y nombre con ella.
# Chrome conserva la excepción explícita del ensayo T05; no se relaja producto.
npx playwright test tests/browser/proxy.spec.ts --workers=1 --retries=0
# Recreación solo del proxy: mismo certificado persistente e instancia de juego.
ca_before=$(sha256sum "$proof/local-ca.crt" | cut -d ' ' -f1)
compose up -d --no-deps --force-recreate caddy
compose cp caddy:/data/caddy/pki/authorities/local/root.crt "$proof/local-ca-after.crt"
test "$ca_before" = "$(sha256sum "$proof/local-ca-after.crt" | cut -d ' ' -f1)"
test "$app" = "$(compose ps -q app)"
wait_tls
docker exec -i "$app" node --input-type=module < tools/ci-image-runtime.mjs > "$proof/runtime-after.json"
# B21: misma imagen OCI, volúmenes propios y HUMAN exclusivamente fabricado.
bash tools/ci-usage.sh
archive_sha=$(sha256sum "$proof/karta3.oci.tar" | cut -d ' ' -f1)
jq -n --arg commit "$CHECKED_SHA" --arg digest "$manifest_digest" --arg config "$config_digest" \
  --arg archive "$archive_sha" --arg run "$GITHUB_RUN_ID" --arg attempt "$GITHUB_RUN_ATTEMPT" \
  --arg started "$started" --arg completed "$(date -u +%FT%TZ)" \
  '{commit:$commit,platform:"linux/amd64",ociManifestDigest:$digest,imageConfigDigest:$config,
    archiveSha256:$archive,runId:$run,runAttempt:$attempt,started:$started,completed:$completed,
    registryPublished:false,checks:{nativeSharp:true,nonRoot:true,readOnly:true,health:true,
    approvedDeckHashes:true,httpsLocalCA:true,proxyChrome:1,certificatePersistence:true,
    statisticsModel:"AGG_DAILY_V1",statisticsSchema:1,retiredModulesAbsent:true,
    statisticsSyntheticVolume:true,statisticsPersistence:true,statisticsEncryptedRestore:true,
    statisticsOff:true,statisticsSeparatePermission:true,statisticsReadOnlyKey:true,
    statisticsIndividualDetailAbsent:true}}' > "$proof/trace.json"
cat "$proof/trace.json"
# No se conservan configuraciones generales/variables de contenedores como artefacto.
rm "$proof/container.json"
