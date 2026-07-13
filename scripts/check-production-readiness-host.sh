#!/bin/sh
set -eu

BASE_URL=${TCWIKI_READINESS_BASE_URL:-https://wiki.thorchain.no}
STATE_DIR=${TCWIKI_READINESS_STATE_DIR:-/var/lib/tcwiki-readiness-monitor}
RUNTIME_DIR=${TCWIKI_READINESS_RUNTIME_DIR:-/run/tcwiki-readiness-monitor}
CURL_BIN=${TCWIKI_READINESS_CURL_BIN:-curl}
JQ_BIN=${TCWIKI_READINESS_JQ_BIN:-jq}
SLEEP_BIN=${TCWIKI_READINESS_SLEEP_BIN:-sleep}
FLOCK_BIN=${TCWIKI_READINESS_FLOCK_BIN:-flock}
MV_BIN=${TCWIKI_READINESS_MV_BIN:-mv}
SAMPLE_COUNT=3
INTERVAL_SECONDS=60
ENDPOINT=${BASE_URL%/}/api/ready?contract=strict

mkdir -p "$STATE_DIR" "$RUNTIME_DIR"
exec 9>"$RUNTIME_DIR/monitor.lock"
if ! "$FLOCK_BIN" -n 9; then
  printf '%s\n' 'tcwiki-readiness-monitor transition=overlap status=skipped'
  exit 0
fi

run_dir=$(mktemp -d "$STATE_DIR/.run.XXXXXX")
evidence_tmp=''
state_tmp=''

cleanup() {
  rm -rf "$run_dir"
  if [ -n "$evidence_tmp" ]; then
    rm -f "$evidence_tmp"
  fi
  if [ -n "$state_tmp" ]; then
    rm -f "$state_tmp"
  fi
}

trap cleanup EXIT
trap 'exit 129' HUP
trap 'exit 130' INT
trap 'exit 143' TERM

now() {
  date -u '+%Y-%m-%dT%H:%M:%SZ'
}

bounded_file_text() {
  "$JQ_BIN" -Rrs 'gsub("\\s+"; " ") | if length > 500 then .[0:497] + "..." else . end' "$1"
}

write_error() {
  "$JQ_BIN" -n \
    --arg observedAt "$1" \
    --arg error "$2" \
    '{observedAt: $observedAt, error: $error}' > "$3"
}

started_at=$(now)
index=1
while [ "$index" -le "$SAMPLE_COUNT" ]; do
  if [ "$index" -gt 1 ]; then
    "$SLEEP_BIN" "$INTERVAL_SECONDS"
  fi

  observed_at=$(now)
  body="$run_dir/response-$index.json"
  error_file="$run_dir/curl-$index.err"
  sample="$run_dir/sample-$index.json"

  if http_status=$("$CURL_BIN" \
    --silent \
    --show-error \
    --max-time 10 \
    --max-filesize 1048576 \
    --output "$body" \
    --write-out '%{http_code}' \
    "$ENDPOINT" 2>"$error_file"); then
    if ! "$JQ_BIN" \
      --arg observedAt "$observed_at" \
      --argjson httpStatus "$http_status" \
      '
        def nonempty: type == "string" and length > 0;
        def bounded: gsub("\\s+"; " ") | if length > 500 then .[0:497] + "..." else . end;
        def valid:
          (.status == "ready" or .status == "degraded") and
          (.ready | type == "boolean") and
          ((.status == "ready") == .ready) and
          (.checkedAt | nonempty) and
          (.version | nonempty) and
          (.commit | nonempty) and
          (.image | nonempty) and
          (.reasons | type == "array") and
          ([.reasons[] | select(type != "string")] | length == 0) and
          (.sources | type == "object") and
          (.sources.midgard | type == "object") and
          (.sources.thornode | type == "object") and
          (($httpStatus == 200 and .ready) or ($httpStatus == 503 and (.ready | not)));
        if valid then
          {
            observedAt: $observedAt,
            readiness: {
              observedAt: $observedAt,
              httpStatus: $httpStatus,
              checkedAt,
              status,
              ready,
              version,
              commit,
              image,
              reasons: [.reasons[] | bounded],
              thornode: {
                status: (.sources.thornode.status // null),
                source: (
                  if (.sources.thornode.source | type) == "object" then
                    {
                      label: (.sources.thornode.source.label // null),
                      url: (.sources.thornode.source.url // null)
                    }
                  else
                    null
                  end
                ),
                height: (.sources.thornode.thorchainHeight // null),
                blockTime: (.sources.thornode.thorchainBlockTime // null),
                blockAgeSeconds: (.sources.thornode.thorchainBlockAgeSeconds // null),
                heightLagBlocks: (.sources.thornode.heightLagBlocks // null),
                warningCategories: ([
                  (.sources.thornode.sourceWarningDetails // [])[]?
                  | .category
                  | select(type == "string")
                ] | unique)
              }
            }
          }
        else
          error("readiness contract mismatch")
        end
      ' "$body" > "$sample" 2>"$run_dir/validation-$index.err"; then
      write_error "$observed_at" 'readiness contract mismatch' "$sample"
    fi
  else
    write_error "$observed_at" "$(bounded_file_text "$error_file")" "$sample"
  fi

  index=$((index + 1))
done

completed_at=$(now)
evidence_tmp="$STATE_DIR/.latest.$$.json"
state_tmp="$STATE_DIR/.state.$$.json"

"$JQ_BIN" -s \
  --arg generatedAt "$completed_at" \
  --arg startedAt "$started_at" \
  --arg completedAt "$completed_at" \
  --arg baseUrl "${BASE_URL%/}" \
  '
    . as $samples
    | ([$samples[] | select(has("error") | not) | select(.readiness.ready)] | length) as $ready
    | ([$samples[] | select(has("error") | not) | select(.readiness.ready | not)] | length) as $degraded
    | ([$samples[] | select(has("error"))] | length) as $errors
    | ($ready == 0) as $failed
    | ($failed and $degraded > 0) as $persistent
    | {
        schemaVersion: 1,
        kind: "tcwiki-host-readiness-monitor",
        generatedAt: $generatedAt,
        startedAt: $startedAt,
        completedAt: $completedAt,
        baseUrl: $baseUrl,
        status: (if $failed then "fail" else "pass" end),
        exitCode: (if $failed then 1 else 0 end),
        failureReason: (
          if $persistent then
            "persistent-degraded-readiness"
          elif $failed then
            "no-valid-readiness-samples"
          else
            "none"
          end
        ),
        summary: (
          if $persistent then
            "Production readiness remained degraded for all 3 samples."
          elif $failed then
            "No production readiness sample was usable; \($degraded) degraded and \($errors) errored."
          else
            "Production readiness was usable in \($ready) of 3 samples; \($degraded) degraded and \($errors) errored."
          end
        ),
        counts: {
          total: 3,
          ready: $ready,
          degraded: $degraded,
          errors: $errors
        },
        samples: $samples
      }
  ' "$run_dir"/sample-*.json > "$evidence_tmp"

status=$("$JQ_BIN" -r .status "$evidence_tmp")
reason=$("$JQ_BIN" -r .failureReason "$evidence_tmp")
summary=$("$JQ_BIN" -r .summary "$evidence_tmp")
previous=unknown
previous_since=''

if [ -f "$STATE_DIR/state.json" ]; then
  previous=$("$JQ_BIN" -er '.status | select(. == "pass" or . == "fail")' "$STATE_DIR/state.json" 2>/dev/null || printf unknown)
  previous_since=$("$JQ_BIN" -er '.since | select(type == "string" and length > 0)' "$STATE_DIR/state.json" 2>/dev/null || printf '')
fi

if [ "$previous" = unknown ]; then
  transition=initial
elif [ "$previous" = "$status" ]; then
  transition=steady
elif [ "$status" = fail ]; then
  transition=degraded
else
  transition=recovered
fi

if [ "$previous" = "$status" ] && [ -n "$previous_since" ]; then
  since=$previous_since
else
  since=$completed_at
fi

"$JQ_BIN" -n \
  --arg status "$status" \
  --arg since "$since" \
  '{status: $status, since: $since}' > "$state_tmp"

"$MV_BIN" "$evidence_tmp" "$STATE_DIR/latest.json"
"$MV_BIN" "$state_tmp" "$STATE_DIR/state.json"

printf 'tcwiki-readiness-monitor transition=%s status=%s failure_reason=%s summary=%s\n' \
  "$transition" \
  "$status" \
  "$reason" \
  "$summary"

if [ "$status" = fail ]; then
  exit 1
fi
