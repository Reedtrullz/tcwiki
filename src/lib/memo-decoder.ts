import type { MemoDecodeResult, MemoDecoderAction, MemoDecoderField, MemoDecoderStatus } from './types';

export const MEMO_DECODER_MAX_BYTES = 250;
const MAX_AFFILIATES = 8;
const UINT64_MAX = '18446744073709551615';
const INT64_MIN_MAGNITUDE = '9223372036854775808';
const INT64_MAX = '9223372036854775807';
const UINT256_MAX = '115792089237316195423570985008687907853269984665640564039457584007913129639935';
const BASE58 = /^[1-9A-HJ-NP-Za-km-z]+$/;

function field(id: string, label: string, raw: string, interpretation: string): MemoDecoderField {
  return { id, label, raw, interpretation };
}

function failure(
  status: Exclude<MemoDecoderStatus, 'decoded'>,
  original: string,
  byteLength: number,
  message: string,
  fields: MemoDecoderField[] = []
): MemoDecodeResult {
  return { status, original, byteLength, fields, message };
}

function utf8ByteLengthUpToLimit(value: string, limit: number): number {
  let byteLength = 0;

  for (let index = 0; index < value.length; index += 1) {
    const unit = value.charCodeAt(index);
    if (unit >= 0xd800 && unit <= 0xdbff && index + 1 < value.length) {
      const next = value.charCodeAt(index + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        byteLength += 4;
        index += 1;
      } else {
        byteLength += 3;
      }
    } else if (unit >= 0xd800 && unit <= 0xdfff) {
      byteLength += 3;
    } else if (unit <= 0x7f) {
      byteLength += 1;
    } else if (unit <= 0x7ff) {
      byteLength += 2;
    } else {
      byteLength += 3;
    }

    if (byteLength > limit) return limit + 1;
  }

  return byteLength;
}

function normalizeUnsigned(raw: string): string {
  return raw.replace(/^0+(?=\d)/, '');
}

function compareUnsigned(left: string, right: string): number {
  const normalizedLeft = normalizeUnsigned(left);
  const normalizedRight = normalizeUnsigned(right);
  if (normalizedLeft.length !== normalizedRight.length) {
    return normalizedLeft.length < normalizedRight.length ? -1 : 1;
  }
  return normalizedLeft === normalizedRight ? 0 : normalizedLeft < normalizedRight ? -1 : 1;
}

function parseUnsignedInteger(raw: string, max: string): string | undefined {
  if (!/^\d+$/.test(raw)) return undefined;
  const value = normalizeUnsigned(raw);
  return compareUnsigned(value, max) <= 0 ? value : undefined;
}

function isFractionalOrScientificNumericNotation(raw: string): boolean {
  return /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(raw) && /[.eE]/.test(raw);
}

function parsePriceLimit(raw: string, allowScientific: boolean): { value: string } | { status: 'unsupported' | 'malformed'; message: string } {
  if (raw.includes('.')) {
    return { status: 'unsupported', message: 'Fractional limit forms are outside this decoder subset.' };
  }

  let value: string;
  if (/[eE]/.test(raw)) {
    if (!allowScientific) {
      return { status: 'unsupported', message: 'Scientific notation in a streaming tuple is outside this decoder subset.' };
    }
    const match = /^(\d+)[eE]\+?(\d+)$/.exec(raw);
    if (!match) {
      return { status: 'unsupported', message: 'Only integer-coefficient scientific limits with a nonnegative exponent are supported.' };
    }
    const exponentDigits = normalizeUnsigned(match[2]);
    if (compareUnsigned(exponentDigits, '77') > 0) {
      return { status: 'unsupported', message: 'Scientific limit exponents above 77 are outside the bounded decoder subset.' };
    }
    const coefficient = normalizeUnsigned(match[1]);
    const exponent = Number(exponentDigits);
    value = coefficient === '0' ? '0' : `${coefficient}${'0'.repeat(exponent)}`;
  } else {
    if (!/^\d+$/.test(raw)) {
      return { status: 'malformed', message: 'The price-limit token is not an unsigned integer.' };
    }
    value = normalizeUnsigned(raw);
  }

  if (compareUnsigned(value, UINT256_MAX) > 0) {
    return { status: 'malformed', message: 'The interpreted price limit exceeds the source uint256 width.' };
  }

  return { value };
}

function hasSupportedTxIdShape(value: string): boolean {
  if (/^[0-9a-fA-F]{64}$/.test(value)) return true;
  if (/^0x[0-9a-fA-F]{64}$/i.test(value)) return true;
  if (/^[0-9a-fA-F]{64}-\d+$/.test(value)) return true;
  return (value.length === 87 || value.length === 88) && BASE58.test(value);
}

function decodeSwap(original: string, byteLength: number, tokens: string[]): MemoDecodeResult {
  const actionField = field('action', 'Memo action token', tokens[0], 'Recognized as swap intent by the reviewed action-token map.');
  if (tokens.length > 6) {
    return failure('unsupported', original, byteLength, 'DEX and later swap suffix fields are outside this decoder subset.', [actionField]);
  }
  if (!tokens[1]) {
    return failure('malformed', original, byteLength, 'A swap memo needs an asset token.', [actionField]);
  }

  const fields: MemoDecoderField[] = [
    field('action', 'Memo action token', tokens[0], 'Swap intent; this does not validate a transaction.'),
    field(
      'asset',
      'Asset token (literal)',
      tokens[1],
      tokens[1].includes('.')
        ? 'Notation token only; chain, asset support, and version applicability are not checked.'
        : 'Unresolved shorthand or historical alias; no current-state lookup is performed.'
    ),
  ];

  const addressToken = tokens[2] ?? '';
  const slashIndex = addressToken.indexOf('/');
  if (slashIndex >= 0) {
    if (addressToken.indexOf('/', slashIndex + 1) >= 0) {
      return failure('unsupported', original, byteLength, 'More than one destination/refund separator is outside this decoder subset.', fields);
    }
    const destination = addressToken.slice(0, slashIndex);
    const refundAddress = addressToken.slice(slashIndex + 1);
    fields.push(field(
      'destination',
      'Destination token (literal)',
      destination,
      destination ? 'Address or name resolution, ownership, and chain validity are unknown.' : 'Destination token omitted; sender-context behavior is not inferred here.'
    ));
    fields.push(field(
      'refund-address',
      'Refund token (literal)',
      refundAddress,
      refundAddress ? 'Address or name resolution, ownership, and chain validity are unknown.' : 'No refund token was supplied after the separator.'
    ));
    if (!destination && refundAddress) {
      return failure('malformed', original, byteLength, 'A refund token is present without a destination token.', fields);
    }
  } else {
    fields.push(field(
      'destination',
      'Destination token (literal)',
      addressToken,
      addressToken ? 'Address or name resolution, ownership, and chain validity are unknown.' : 'Destination token omitted; sender-context behavior is not inferred here.'
    ));
    fields.push(field('refund-address', 'Refund token (literal)', '', 'No custom refund token was supplied.'));
  }

  const limitToken = tokens[3] ?? '';
  if (limitToken.includes('/')) {
    const streamingParts = limitToken.split('/');
    if (streamingParts.length > 3) {
      return failure('unsupported', original, byteLength, 'Streaming tuples with more than three slots are outside this decoder subset.', fields);
    }
    const limitRaw = streamingParts[0] ?? '';
    const parsedLimit = parsePriceLimit(limitRaw || '0', false);
    if ('status' in parsedLimit) return failure(parsedLimit.status, original, byteLength, parsedLimit.message, fields);
    fields.push(field('streaming-tuple', 'Streaming tuple (raw)', limitToken, 'Raw tuple preserved; values below are read as grammar fields only.'));
    fields.push(field('price-limit', 'Price-limit token (raw)', limitRaw, `Unsigned integer limit; interpreted as ${parsedLimit.value} within uint256.`));

    const intervalRaw = streamingParts[1] ?? '';
    if (isFractionalOrScientificNumericNotation(intervalRaw)) {
      return failure('unsupported', original, byteLength, 'Fractional or scientific streaming intervals are outside this decoder subset.', fields);
    }
    const intervalValue = intervalRaw ? parseUnsignedInteger(intervalRaw, UINT64_MAX) : '0';
    if (intervalValue === undefined) {
      return failure('malformed', original, byteLength, 'Streaming interval is not an unsigned uint64 value.', fields);
    }
    fields.push(field('streaming-interval', 'Streaming interval (raw)', intervalRaw, intervalRaw ? `Unsigned uint64 token ${intervalValue}; current execution meaning is not checked.` : 'Omitted slot; the source parser defaults this slot to zero.'));

    const quantityRaw = streamingParts[2] ?? '';
    if (isFractionalOrScientificNumericNotation(quantityRaw)) {
      return failure('unsupported', original, byteLength, 'Fractional or scientific streaming quantities are outside this decoder subset.', fields);
    }
    const quantityValue = quantityRaw ? parseUnsignedInteger(quantityRaw, UINT64_MAX) : '0';
    if (quantityValue === undefined) {
      return failure('malformed', original, byteLength, 'Streaming quantity is not an unsigned uint64 value.', fields);
    }
    fields.push(field(
      'streaming-quantity',
      'Streaming quantity (raw)',
      quantityRaw,
      quantityRaw
        ? quantityValue === '0' ? 'Zero is queue-context dependent; this decoder does not infer the eventual stream count.' : `Unsigned uint64 token ${quantityValue}; execution is not checked.`
        : 'Omitted slot; the source parser defaults this slot to zero, whose queue meaning depends on context.'
    ));
  } else if (limitToken) {
    const parsedLimit = parsePriceLimit(limitToken, true);
    if ('status' in parsedLimit) return failure(parsedLimit.status, original, byteLength, parsedLimit.message, fields);
    fields.push(field('price-limit', 'Price-limit token (raw)', limitToken, `Unsigned integer limit; interpreted as ${parsedLimit.value} within uint256.`));
  }

  const affiliateNamesRaw = tokens[4] ?? '';
  const affiliateFeesRaw = tokens[5] ?? '';
  if (affiliateNamesRaw || affiliateFeesRaw) {
    if (!affiliateNamesRaw || !affiliateFeesRaw) {
      return failure('malformed', original, byteLength, 'Affiliate names and fee fields must both be present in this subset.', fields);
    }
    const names = affiliateNamesRaw.split('/');
    const fees = affiliateFeesRaw.split('/');
    if (names.some((name) => !name)) {
      return failure('malformed', original, byteLength, 'Affiliate names and fees must be nonempty literal tokens and unsigned integers.', fields);
    }
    if (fees.some(isFractionalOrScientificNumericNotation)) {
      return failure('unsupported', original, byteLength, 'Fractional or scientific affiliate fee tokens are outside this decoder subset.', fields);
    }
    if (fees.some((fee) => !/^\d+$/.test(fee))) {
      return failure('malformed', original, byteLength, 'Affiliate names and fees must be nonempty literal tokens and unsigned integers.', fields);
    }
    if (names.length > MAX_AFFILIATES) {
      return failure('unsupported', original, byteLength, `This educational tool supports at most ${MAX_AFFILIATES} affiliate entries; this is not a protocol cap.`, fields);
    }
    if (fees.length !== names.length && fees.length !== 1) {
      return failure('malformed', original, byteLength, 'Affiliate name and fee counts do not match, and the single-fee form does not apply.', fields);
    }
    names.forEach((name, index) => {
      const feeRaw = fees.length === 1 ? fees[0] : fees[index];
      fields.push(field(`affiliate-${index + 1}`, `Affiliate ${index + 1} (literal)`, name, 'Literal affiliate token; THORName resolution and ownership are not checked.'));
      fields.push(field(
        `affiliate-fee-${index + 1}`,
        `Affiliate ${index + 1} fee (raw bps token)`,
        feeRaw,
        'Unsigned integer token only; no current fee cap, configured affiliate limit, or dynamic-fee rule is validated.'
      ));
    });
  }

  return {
    status: 'decoded',
    original,
    byteLength,
    action: 'swap' satisfies MemoDecoderAction,
    fields,
    message: 'Syntax interpreted as swap intent only; route availability, protocol validation, execution, and settlement are unknown.',
  };
}

export function decodeMemo(original: string): MemoDecodeResult {
  const byteLength = utf8ByteLengthUpToLimit(original, MEMO_DECODER_MAX_BYTES);
  if (!original) return failure('empty', original, byteLength, 'Enter a memo to inspect its supported syntax.');
  if (byteLength > MEMO_DECODER_MAX_BYTES) {
    return failure('too-long', original, byteLength, `The local decoder accepts at most ${MEMO_DECODER_MAX_BYTES} UTF-8 bytes; the original input remains unchanged.`);
  }
  if (original.includes('|')) {
    return failure('unsupported', original, byteLength, 'Pipe suffixes and streaming aliases are outside this decoder subset and remain unparsed.');
  }

  const tokens = original.split(':');
  const actionToken = tokens[0] ?? '';
  const action = actionToken.toLowerCase();

  if (action === '=' || action === 's' || action === 'swap') {
    return decodeSwap(original, byteLength, tokens);
  }

  if (action === 'out' || action === 'refund') {
    if (tokens.length !== 2) {
      return failure('unsupported', original, byteLength, 'Outbound/refund suffix fields are outside this decoder subset.', [field('action', 'Memo action token', actionToken, 'Action token is case-insensitively recognized.')]);
    }
    const txId = tokens[1];
    if (!txId || !hasSupportedTxIdShape(txId)) {
      return failure('malformed', original, byteLength, 'Transaction identifier does not match one of the documented bounded shapes.', [field('action', 'Memo action token', actionToken, 'Action token is case-insensitively recognized.')]);
    }
    return {
      status: 'decoded',
      original,
      byteLength,
      action: action === 'out' ? 'outbound' : 'refund',
      fields: [
        field('action', 'Memo action token', actionToken, 'Action token is case-insensitively recognized; this labels the memo role only.'),
        field('transaction-id', 'Referenced transaction ID (raw)', txId, 'Shape only; the referenced transaction, chain, and lifecycle are not looked up.'),
      ],
      message: 'Memo role and identifier shape interpreted only; this does not establish a transaction match or settlement.',
    };
  }

  if (action === 'migrate') {
    if (tokens.length !== 2) {
      return failure('unsupported', original, byteLength, 'MIGRATE suffix fields are outside this decoder subset.', [field('action', 'Memo action token', actionToken, 'Action token is case-insensitively recognized.')]);
    }
    const rawHeight = tokens[1];
    if (isFractionalOrScientificNumericNotation(rawHeight)) {
      return failure('unsupported', original, byteLength, 'Fractional or scientific MIGRATE heights are outside this decoder subset.', [field('action', 'Memo action token', actionToken, 'Action token is case-insensitively recognized.')]);
    }
    if (!/^[+-]?\d+$/.test(rawHeight)) {
      return failure('malformed', original, byteLength, 'MIGRATE height is not a signed integer token.', [field('action', 'Memo action token', actionToken, 'Action token is case-insensitively recognized.')]);
    }
    const sign = rawHeight.startsWith('-') ? '-' : '+';
    const magnitude = normalizeUnsigned(rawHeight.replace(/^[+-]/, ''));
    const allowedMagnitude = sign === '-' ? INT64_MIN_MAGNITUDE : INT64_MAX;
    if (compareUnsigned(magnitude, allowedMagnitude) > 0) {
      return failure('malformed', original, byteLength, 'MIGRATE height exceeds the source signed int64 width.', [field('action', 'Memo action token', actionToken, 'Action token is case-insensitively recognized.')]);
    }
    const height = sign === '-' && magnitude !== '0' ? `-${magnitude}` : magnitude;
    return {
      status: 'decoded',
      original,
      byteLength,
      action: 'migrate',
      fields: [
        field('action', 'Memo action token', actionToken, 'Migration intent token only; no migration lifecycle is checked.'),
        field('memo-height', 'THORChain memo height (raw)', rawHeight, `Signed int64 token ${height}; it is not resolved against current chain height.`),
      ],
      message: 'Migration memo syntax interpreted only; a matched or completed migration remains unknown.',
    };
  }

  return failure('unsupported', original, byteLength, 'Action token is outside the supported educational subset.', [field('action', 'Memo action token', actionToken, 'Raw token preserved without alias guessing.')]);
}
