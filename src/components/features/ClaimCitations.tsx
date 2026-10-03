import type { ClaimEvidence } from '@/lib/types';
import { recordAnchor } from '@/lib/utils';

export function ClaimCitations({ claims }: { claims: ClaimEvidence[] }) {
  if (!claims.length) return null;
  return <details className="mt-2 rounded border border-border p-3 text-xs text-slate-300">
    <summary className="cursor-pointer text-accent">Claim evidence ({claims.length})</summary>
    <ul className="mt-3 space-y-4">
      {claims.map(claim => <li key={claim.id} id={recordAnchor('claim', claim.id)} className="scroll-mt-24">
        <p className="font-semibold text-slate-100">{claim.summary}</p>
        <p className="mt-1">{claim.scope} · {claim.decision} · {claim.versionScope}</p>
        <p className="mt-1">Observed {claim.observedAt}; claim reviewed {claim.reviewedAt}; review due {claim.nextReviewDue}.</p>
        <a href={claim.source.url} rel="noopener noreferrer" className="mt-1 inline-block text-accent underline">{claim.source.label}</a>
        {claim.supersedes && <p className="mt-1">Supersedes for this question: <a href={`#${recordAnchor('claim', claim.supersedes)}`} className="text-accent underline">{claim.supersedes}</a></p>}
        <p className="mt-1 text-slate-400">{claim.limitation}</p>
      </li>)}
    </ul>
  </details>;
}
