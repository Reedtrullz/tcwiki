import type { ClpScenarioResult } from '@/lib/types';

const SCALE = BigInt(100000000);
const ZERO = BigInt(0);
const MAX_UNITS = BigInt(1000000000) * SCALE;

function modelUnits(value: string): bigint | null {
  if (value.length > 19 || !/^\d{1,10}(?:\.\d{1,8})?$/.test(value)) return null;
  const [whole, fraction = ''] = value.split('.');
  const units = BigInt(whole) * SCALE + BigInt(fraction.padEnd(8, '0'));
  return units <= MAX_UNITS ? units : null;
}

function displayUnits(value: bigint): string {
  return `${value / SCALE}.${(value % SCALE).toString().padStart(8, '0')}`;
}

// One algebraic leg in abstract fixed-point model units, not an execution quote.
export function calculateClpScenario(input: string, inputDepth: string, outputDepth: string): ClpScenarioResult | null {
  const x = modelUnits(input);
  const X = modelUnits(inputDepth);
  const Y = modelUnits(outputDepth);
  if (x === null || X === null || Y === null || X === ZERO || Y === ZERO) return null;
  const denominator = (x + X) * (x + X);
  return {
    slipPercent: displayUnits(x * BigInt(100) * SCALE / (x + X)),
    fee: displayUnits(x * x * Y / denominator),
    output: displayUnits(x * X * Y / denominator),
  };
}
