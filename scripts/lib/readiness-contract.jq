# Node is absent on the independent host. Keep this equivalent to the required
# identity/source rules in readiness-contract.mjs; shared fixtures detect drift.
def nonempty: type == "string" and length > 0;
def strings: type == "array" and all(.[]; type == "string");
def empty_array: type == "array" and length == 0;
def trim: gsub("^\\s+|\\s+$"; "");
def safe_height: type == "number" and . >= 0 and . <= 9007199254740991 and floor == .;
def warning_details:
  type == "array" and all(.[];
    type == "object" and
    (.severity | IN("critical", "warning", "review")) and
    (.category | IN("freshness", "pinning", "height-divergence", "source-shape", "mimir-parse", "mimir-support", "unknown-chain", "unknown-operation", "control-applicability", "other")) and
    (.message | nonempty) and (.action | nonempty) and
    (if has("keys") then .keys | strings else true end) and
    (if has("scopes") then .scopes | strings else true end));
def source:
  type == "object" and (.label | nonempty) and (.url | nonempty) and
  (if has("heightPinning") then . as $s | .heightPinning as $p |
    ($p | type == "object") and ($p.requestedHeight | safe_height) and
    ($p.verification | IN("verified", "unverified")) and
    (if $p.verification == "verified" then $p.observedHeight == $p.requestedHeight else ($p | has("observedHeight") | not) end) and
    ((try ($s.url | capture("[?&]height=(?<height>[0-9]+)(&|$)").height | tonumber) catch null) == $p.requestedHeight)
  else true end);
def optional_source: if has("source") then .source | source else true end;
def sources: type == "array" and all(.[]; source);
def check:
  type == "object" and (.status | IN("ok", "degraded")) and optional_source;
def visible_check: check and (.checkedAt | nonempty);
def optional_string($key): if has($key) then .[$key] | nonempty else true end;
def optional_number($key; $null): if has($key) then .[$key] | (if $null and . == null then true else type == "number" and (isinfinite | not) and (isnan | not) end) else true end;
def optional_boolean($key): if has($key) then .[$key] | type == "boolean" else true end;
def optional_sources: if has("sources") then .sources | sources else true end;
def feature:
  check and optional_sources and optional_string("checkedAt") and optional_string("error") and
  optional_number("thorchainHeight"; false) and optional_number("thorchainBlockAgeSeconds"; false) and
  optional_string("thorchainBlockTime") and optional_boolean("snapshotPinned") and
  (.sourceWarnings | strings) and (.sourceWarningDetails | warning_details);
def dynamic_feature: . as $feature | feature and optional_string("enabledState") and
  all(["enabledValue", "currentEpoch", "trackedRecordCount", "currentEntryCount", "whitelistedThornameCount", "historyThornameCount", "historySampleCount"][];
    . as $key | $feature | optional_number($key; false));
def pol_feature: . as $feature | feature and optional_number("activePolPoolCount"; false) and
  all(["depositMaturityBlocksState", "maxReserveBackstopState", "minRunePoolDepthState"][]; . as $key | $feature | optional_string($key)) and
  all(["depositMaturityBlocksValue", "maxReserveBackstopValue", "minRunePoolDepthValue"][]; . as $key | $feature | optional_number($key; true));
def origin: . as $url | try (capture("^(?<origin>[a-zA-Z][a-zA-Z0-9+.-]*://[^/?#]+)").origin | ascii_downcase) catch $url;
def ready_source: .status == "ok" and (.source | source);
def same_provider($ref): ready_source and ((.source.url | origin) == ($ref.url | origin));
def endpoint($suffix; $height):
  any(.[]; (.url | test("^https?://[^/?#]+/[^?#]*" + $suffix + "(?:[?]|$)"; "i")) and
    (if $height then .url | test("[?&]height=[0-9]+(&|$)") else true end));
def exact_endpoints($paths): . as $sources | sources and endpoint("/base/tendermint/v1beta1/blocks/latest"; false) and
  all($paths[]; . as $path | $sources | endpoint($path; true));
def metadata_warnings:
  (.version | trim) as $v | (.commit | trim) as $c | (.image | trim) as $i |
  [if ($v | ascii_downcase | IN("", "unknown", "development", "standalone-smoke", "local")) or ($v | test("^0+$")) then "Runtime version metadata is missing or still using a local placeholder." else empty end,
   if ($c | ascii_downcase | IN("", "unknown", "development", "standalone-smoke", "local")) or ($c | test("^[0-9a-f]{7,40}$"; "i") | not) or ($c | test("^0+$")) then "Runtime commit metadata is missing or not a git SHA." else empty end,
   if ($i | test("^[^\\s]+@sha256:[0-9a-f]{64}$"; "i") | not) or ($i | test("@sha256:0{64}$")) then "Runtime image metadata is missing or not an immutable sha256 digest ref." else empty end];
def runtime_valid:
  . as $body | metadata_warnings as $warnings | .runtime as $r |
  ($r | type == "object") and ($r.version == .version) and ($r.commit == .commit) and ($r.image == .image) and
  ($r.strict | type == "boolean") and ($r.verified | type == "boolean") and ($r.warnings | strings) and
  ($r.verified == ($warnings | length == 0)) and (($r.warnings | sort) == ($warnings | sort));
def nonblocking: .severity == "review" and (.category | IN("mimir-support", "unknown-chain"));
def ready_thornode_warnings($warnings): . as $t |
  all(.sourceWarningDetails[]; . as $detail | (.message | trim) as $message | ($detail | nonblocking) and
    ($message | length > 0) and any($t.sourceWarnings[]; trim == $message)) and
  all(.sourceWarnings[]; trim as $message | ($message | length > 0) and
    any($t.sourceWarningDetails[]; nonblocking and (.message | trim) == $message) and
    any($warnings[]; trim == $message));
def readiness_valid:
  try (
    . as $body | .sources.midgard as $m | .sources.thornode as $t |
    type == "object" and (.status | IN("ready", "degraded")) and (.ready | type == "boolean") and
    ((.status == "ready") == .ready) and (.checkedAt | nonempty) and
    (.version | nonempty) and (.commit | nonempty) and (.image | nonempty) and runtime_valid and
    (.reasons | strings) and (.warnings | strings) and (.sources | type == "object") and
    ($m | check) and ($m.healthWarnings | strings) and ($m.sourceWarnings | strings) and ($m.sourceWarningDetails | warning_details) and
    ($m.visibleData | type == "object") and all([$m.visibleData.network, $m.visibleData.pools, $m.visibleData.earnings][]; visible_check) and
    ($t | check) and ($t.sourceCount | type == "number") and
    all([$t.activeControlKeys, $t.activeChainKeys, $t.activeEvidenceKeys, $t.scheduledMimirKeys, $t.invalidMimirKeys, $t.sourceWarnings][]; strings) and
    ($t.chainStatuses | type == "array") and ($t.monitoredControls | type == "array") and ($t.sourceWarningDetails | warning_details) and
    ($t.dynamicFees | dynamic_feature) and ($t.runePoolPol | pol_feature) and
    (if $body.ready then
      ($body.reasons | empty_array) and ($m | ready_source) and
      all([$m.visibleData.network, $m.visibleData.pools, $m.visibleData.earnings][]; same_provider($m.source)) and
      ($m.sourceWarnings | empty_array) and ($m.sourceWarningDetails | empty_array) and
      ($t | ready_source) and ($t.sources | exact_endpoints(["/mimir", "/inbound_addresses", "/version", "/lastblock"])) and
      ($t | ready_thornode_warnings($body.warnings)) and
      ($t.dynamicFees | same_provider($t.source)) and ($t.dynamicFees.sources | exact_endpoints(["/mimir", "/dynamic_l1_fees", "/dynamic_l1_fees_current"])) and
      ($t.dynamicFees.sourceWarnings | empty_array) and ($t.dynamicFees.sourceWarningDetails | empty_array) and
      ($t.runePoolPol | same_provider($t.source)) and ($t.runePoolPol.sources | exact_endpoints(["/mimir", "/runepool"])) and
      ($t.runePoolPol.sourceWarnings | empty_array) and ($t.runePoolPol.sourceWarningDetails | empty_array) and
      (if $body.runtime.strict then $body.runtime.verified and ($body.runtime.warnings | empty_array) else true end)
    else true end)
  ) catch false;
