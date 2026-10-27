import { describe, expect, it } from 'vitest';
import { calculateClpScenario } from '@/lib/clp-learning-lab';

describe('single-leg educational CLP model', () => {
  it('reproduces the official slip/fee/output equations with exact model units', () => {
    expect(calculateClpScenario('100', '1000', '1000')).toEqual({
      slipPercent: '9.09090909', fee: '8.26446280', output: '82.64462809',
    });
    expect(calculateClpScenario('0', '1000', '1000')).toEqual({ slipPercent: '0.00000000', fee: '0.00000000', output: '0.00000000' });
  });
  it('withholds results for invalid, oversized or zero-depth scenarios', () => {
    for (const input of ['', '-1', '1e3', 'NaN', 'Infinity', '0.000000001', '1000000001', '9'.repeat(10000)]) {
      expect(calculateClpScenario(input, '1000', '1000')).toBeNull();
      expect(calculateClpScenario('100', input, '1000')).toBeNull();
    }
    expect(calculateClpScenario('100', '0', '1000')).toBeNull();
    expect(calculateClpScenario('100', '1000', '0')).toBeNull();
  });
  it('preserves small fractions and bounds outputs without floating-point overflow', () => {
    expect(calculateClpScenario('0.00000001', '1', '1')).toEqual({ slipPercent: '0.00000099', fee: '0.00000000', output: '0.00000000' });
    expect(calculateClpScenario('1000000000', '1000000000', '1000000000')).toEqual({ slipPercent: '50.00000000', fee: '250000000.00000000', output: '250000000.00000000' });
    const small = calculateClpScenario('10', '1000', '1000')!;
    const large = calculateClpScenario('100', '1000', '1000')!;
    expect(Number(large.slipPercent)).toBeGreaterThan(Number(small.slipPercent));
    expect(Number(large.fee)).toBeGreaterThan(Number(small.fee));
  });
});
