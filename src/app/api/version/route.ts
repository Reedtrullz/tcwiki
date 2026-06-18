export function GET() {
  return Response.json(
    {
      version: process.env.APP_VERSION ?? process.env.VERSION ?? 'development',
      commit: process.env.COMMIT_SHA ?? 'unknown',
      image: process.env.IMAGE_REF ?? 'unknown',
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}
