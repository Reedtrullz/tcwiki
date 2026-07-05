import { runtimeMetadataResponseFields } from '@/lib/runtime-metadata';

export const dynamic = 'force-dynamic';

export function GET() {
  return Response.json(
    {
      ...runtimeMetadataResponseFields(),
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}
