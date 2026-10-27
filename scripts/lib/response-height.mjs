// THORNode's SDK-v50 REST gateway returns grpc-metadata-x-cosmos-block-height.
export function responseHeightEvidence(requestedHeight, rawHeight) {
  if (!Number.isSafeInteger(requestedHeight) || requestedHeight < 0) throw new Error('Invalid requested height.');
  if (rawHeight == null) return { requestedHeight, verification: 'unverified' };
  if (typeof rawHeight !== 'string' || rawHeight.length > 16 || !/^\d+$/.test(rawHeight)) throw new Error('Malformed response height header.');
  const observedHeight = Number(rawHeight);
  if (!Number.isSafeInteger(observedHeight) || observedHeight !== requestedHeight) {
    throw new Error(`Response height ${rawHeight} does not match requested height ${requestedHeight}.`);
  }
  return { requestedHeight, observedHeight, verification: 'verified' };
}
