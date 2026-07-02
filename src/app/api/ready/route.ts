import MidgardAPI from '@/lib/api/midgard';
import ThornodeAPI from '@/lib/api/thornode';
import type { ReadinessResponse } from '@/lib/types';

export const dynamic = 'force-dynamic';

function runtimeMetadata() {
  return {
    version: process.env.APP_VERSION ?? process.env.VERSION ?? 'development',
    commit: process.env.COMMIT_SHA ?? 'unknown',
    image: process.env.IMAGE_REF ?? 'unknown',
  };
}

export async function GET() {
  const checkedAt = new Date().toISOString();
  const [midgard, thornode] = await Promise.all([
    MidgardAPI.getHealth(),
    ThornodeAPI.getNetworkStatus(),
  ]);
  const reasons: string[] = [];
  const thornodeSourceWarnings = thornode.data?.sourceWarnings ?? [];
  const midgardReady = midgard.status === 'ok' &&
    midgard.data !== undefined &&
    midgard.data.severity !== 'degraded' &&
    midgard.data.severity !== 'unknown';
  const thornodeReady = thornode.status === 'ok' && thornode.data !== undefined && thornodeSourceWarnings.length === 0;

  if (!midgardReady) {
    reasons.push(midgard.error ?? midgard.data?.reasons.join(' ') ?? 'Midgard readiness degraded.');
  }
  if (thornode.status !== 'ok' || thornode.data === undefined) {
    reasons.push(thornode.error ?? 'THORNode readiness degraded.');
  }
  if (thornodeSourceWarnings.length) {
    reasons.push(...thornodeSourceWarnings);
  }

  const ready = midgardReady && thornodeReady;
  const metadata = runtimeMetadata();
  const body: ReadinessResponse = {
    status: ready ? 'ready' : 'degraded',
    ready,
    checkedAt,
    ...metadata,
    sources: {
      midgard: {
        status: midgard.status,
        source: midgard.source,
        health: midgard.data,
        error: midgard.error,
      },
      thornode: {
        status: thornode.status,
        sources: thornode.sources,
        state: thornode.data?.state,
        summary: thornode.data?.summary,
        version: thornode.data?.thorNodeVersion,
        invalidMimirKeys: thornode.data?.invalidMimirKeys ?? [],
        sourceWarnings: thornodeSourceWarnings,
        error: thornode.error,
      },
    },
    reasons,
  };

  return Response.json(
    body,
    {
      status: ready ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}
