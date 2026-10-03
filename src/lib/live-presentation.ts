import type { LiveDataResult } from '@/lib/types';
import { liveDegraded } from '@/lib/trust';
import { collectSourceWarningSignals } from '@/lib/source-warnings';

export interface LivePresentationPolicy<T> {
  kind: 'operational' | 'aggregate' | 'historical';
  reassess?: (result: LiveDataResult<T>, now: number) => LiveDataResult<T>;
}
// Aggregate samples become dated context after missing two configured 60s reads.
// Historical intervals retain their meaning; operational age uses block evidence.
const MISSED_AGGREGATE_REFRESH_MS = 120000;
export function assessLivePresentation<T>(result: LiveDataResult<T> | undefined, error: string | undefined, refreshing: boolean, policy: LivePresentationPolicy<T>, now: number): LiveDataResult<T> {
  let assessed = result ? policy.reassess?.(result, now) ?? result : liveDegraded<T>(error ?? 'Live data unavailable.');
  const hasData = assessed.data !== undefined;
  const age = now - Date.parse(assessed.checkedAt);
  const operationalAgeWarning = policy.kind === 'operational' && collectSourceWarningSignals(assessed.data).details.some(detail => detail.category === 'freshness');
  const stale = hasData && (operationalAgeWarning || (policy.kind === 'aggregate' && (!Number.isFinite(age) || age < 0 || age > MISSED_AGGREGATE_REFRESH_MS)));
  const failed = Boolean(error);
  const state = !hasData ? refreshing ? 'refreshing' : 'unavailable' : stale ? 'stale' : failed ? 'last-good' : refreshing ? 'refreshing' : policy.kind === 'historical' ? 'historical' : 'current';
  if ((error || stale) && hasData) assessed = { ...assessed, status: 'degraded', error: error ?? assessed.error };
  if (policy.kind === 'operational' && error && assessed.data && typeof assessed.data === 'object' && 'sourceWarnings' in assessed.data && 'sourceWarningDetails' in assessed.data) {
    const message = 'Browser refresh failed; retained operation values are dated context until a new read succeeds.';
    const signals = collectSourceWarningSignals(assessed.data);
    assessed = { ...assessed, data: { ...assessed.data,
      sourceWarnings: [...new Set([...signals.messages, message])],
      sourceWarningDetails: [...signals.details, { severity: 'critical', category: 'freshness', message, action: 'Refresh the live source before relying on operation availability.', keys: ['browser-refresh'] }],
      ...('state' in assessed.data && assessed.data.state === 'operational' ? { state: 'degraded', summary: message } : {}),
    } };
  }
  return { ...assessed, presentation: { kind: policy.kind, state } };
}

export async function requireLiveData<T>(fetcher: () => Promise<LiveDataResult<T>>) {
  const result = await fetcher();
  if (result.data === undefined) throw new Error(result.error ?? 'The provider did not return usable data.');
  return result;
}
