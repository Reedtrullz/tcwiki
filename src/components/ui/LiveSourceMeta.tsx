import { LiveDataResult } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';

interface LiveSourceMetaProps {
  result?: LiveDataResult<unknown>;
}

export function LiveSourceMeta({ result }: LiveSourceMetaProps) {
  if (!result) {
    return <p className="text-[11px] text-slate-600">Loading live source...</p>;
  }

  const checkedAt = new Date(result.checkedAt).toLocaleString();
  const sources = result.sources?.length ? result.sources : result.source ? [result.source] : [];

  return (
    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
      <Badge variant={result.status === 'ok' ? 'success' : 'warning'}>
        {result.status === 'ok' ? 'Current-only' : 'Degraded'}
      </Badge>
      <span>Checked {checkedAt}</span>
      {sources.map((source) => (
        <span key={`${source.label}-${source.url}`} className="inline-flex items-center gap-2">
          <span>·</span>
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            {source.label}
          </a>
        </span>
      ))}
    </div>
  );
}
