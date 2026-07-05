import { runtimeMetadataResponseFields } from '@/lib/runtime-metadata';

export const dynamic = 'force-dynamic';

export function GET() {
  return Response.json(
    {
      status: 'healthy',
      ...runtimeMetadataResponseFields(),
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}
