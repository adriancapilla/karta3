#!/usr/bin/env bash
# Publicación manual sin build, actualización de imagen o acceso al VPS.
set -euo pipefail
[[ "$SOURCE_RUN" =~ ^[0-9]+$ && "$ARTIFACT_ID" =~ ^[0-9]+$ ]]
[[ "$INTEGRATION_SHA" =~ ^[0-9a-f]{40}$ && "$EXPECTED_DIGEST" =~ ^sha256:[0-9a-f]{64}$ ]]
test "$GITHUB_REPOSITORY" = adriancapilla/karta3
test "$GITHUB_REF" = refs/heads/main
repo=$GITHUB_REPOSITORY
work="$RUNNER_TEMP/karta3-publication-work"
proof="$RUNNER_TEMP/karta3-publication-proof"
mkdir -p "$work" "$proof"
chmod 700 "$work"
export DOCKER_CONFIG="$work/docker-auth"
mkdir -p "$DOCKER_CONFIG"
container="karta3-pull-$GITHUB_RUN_ID-$GITHUB_RUN_ATTEMPT"
cleanup() { docker rm -f "$container" >/dev/null 2>&1 || true; rm -f "$work/registry-auth.json" "$DOCKER_CONFIG/config.json"; }
trap cleanup EXIT
gh api "repos/$repo" > "$work/repository.json"
jq -e '.private == true' "$work/repository.json"
gh api "repos/$repo/actions/runs/$SOURCE_RUN" > "$proof/source-run.json"
jq -e '.status == "completed" and .conclusion == "success" and .name == "CI" and .path == ".github/workflows/ci.yml"' "$proof/source-run.json"
gh api "repos/$repo/actions/artifacts/$ARTIFACT_ID" > "$proof/source-artifact.json"
jq -e --arg run "$SOURCE_RUN" '.expired == false and (.workflow_run.id | tostring) == $run' "$proof/source-artifact.json"
artifact_name=$(jq -r '.name' "$proof/source-artifact.json")
gh run download "$SOURCE_RUN" --repo "$repo" --name "$artifact_name" --dir "$work/download"
trace="$work/download/trace.json"
source_sha=$(jq -r '.commit' "$trace")
[[ "$source_sha" =~ ^[0-9a-f]{40}$ ]]
jq -e --arg sha "$source_sha" '.head_sha == $sha' "$proof/source-run.json"
jq -e --arg run "$SOURCE_RUN" --arg digest "$EXPECTED_DIGEST" \
  '.runId == $run and .platform == "linux/amd64" and .ociManifestDigest == $digest and .registryPublished == false' "$trace"
git merge-base --is-ancestor "$INTEGRATION_SHA" HEAD
test "$(git rev-parse "$source_sha^{tree}")" = "$(git rev-parse "$INTEGRATION_SHA^{tree}")"
archive="$work/download/karta3.oci.tar"
test "$(sha256sum "$archive" | cut -d ' ' -f1)" = "$(jq -r '.archiveSha256' "$trace")"
skopeo inspect --raw "oci-archive:$archive" > "$proof/manifest.json"
test "sha256:$(sha256sum "$proof/manifest.json" | cut -d ' ' -f1)" = "$EXPECTED_DIGEST"
config_digest=$(jq -r '.config.digest' "$proof/manifest.json")
test "$config_digest" = "$(jq -r '.imageConfigDigest' "$trace")"
skopeo inspect --config "oci-archive:$archive" > "$work/config.json"
jq -e --arg sha "$source_sha" '.os == "linux" and .architecture == "amd64"
  and .config.User == "node" and .config.Labels["org.opencontainers.image.revision"] == $sha
  and .config.Labels["org.opencontainers.image.source"] == "https://github.com/adriancapilla/karta3"' "$work/config.json"
# Un paquete existente debe ser privado y estar asociado antes de escribir.
if gh api users/adriancapilla/packages/container/karta3 > "$work/package-before.json" 2> "$work/package-before-error.txt"; then
  jq -e '.visibility == "private" and .repository.full_name == "adriancapilla/karta3"' "$work/package-before.json"
else
  grep -q 'HTTP 404' "$work/package-before-error.txt"
fi
printf '%s' "$GH_TOKEN" | skopeo login --authfile "$work/registry-auth.json" --username "$GITHUB_ACTOR" --password-stdin ghcr.io
tag="sha-$source_sha-run-$SOURCE_RUN-$(jq -r '.runAttempt' "$trace")"
reference="ghcr.io/adriancapilla/karta3@$EXPECTED_DIGEST"
skopeo copy --authfile "$work/registry-auth.json" --preserve-digests \
  --digestfile "$proof/published-digest.txt" "oci-archive:$archive" "docker://ghcr.io/adriancapilla/karta3:$tag"
test "$(cat "$proof/published-digest.txt")" = "$EXPECTED_DIGEST"
gh api users/adriancapilla/packages/container/karta3 > "$proof/package.json"
jq -e '.visibility == "private" and .repository.full_name == "adriancapilla/karta3" and .repository.private == true' "$proof/package.json"
skopeo inspect --authfile "$work/registry-auth.json" --raw "docker://$reference" > "$proof/downloaded-manifest.json"
cmp "$proof/manifest.json" "$proof/downloaded-manifest.json"
printf '%s' "$GH_TOKEN" | docker login ghcr.io --username "$GITHUB_ACTOR" --password-stdin
docker pull --platform linux/amd64 "$reference"
test "$(docker image inspect "$reference" --format '{{.Id}}')" = "$config_digest"
docker run -d --name "$container" --read-only --tmpfs /tmp "$reference"
ready=false
for attempt in {1..60}; do
  if [ "$(docker inspect "$container" --format '{{.State.Health.Status}}')" = healthy ]; then ready=true; break; fi
  sleep 1
done
test "$ready" = true
docker exec -i "$container" node --input-type=module < tools/ci-image-runtime.mjs > "$proof/runtime-pulled.json"
cp "$trace" "$proof/source-trace.json"
jq -n --arg source "$source_sha" --arg integration "$INTEGRATION_SHA" --arg workflow "$GITHUB_SHA" \
  --arg run "$GITHUB_RUN_ID" --arg artifact "$ARTIFACT_ID" --arg reference "$reference" --arg tag "$tag" \
  --arg digest "$EXPECTED_DIGEST" --arg config "$config_digest" --arg completed "$(date -u +%FT%TZ)" \
  '{sourceCommit:$source,integrationCommit:$integration,publicationWorkflowCommit:$workflow,
  publicationRun:$run,sourceArtifactId:$artifact,imageReference:$reference,tag:$tag,
  ociManifestDigest:$digest,imageConfigDigest:$config,completed:$completed,
  private:true,repository:"adriancapilla/karta3",rebuilt:false,pulledByDigest:true,
  startupHealth:true,nativeSharp:true,nonRoot:true,readonly:true,approvedDeckHashes:true}' > "$proof/publication.json"
cat "$proof/publication.json"
