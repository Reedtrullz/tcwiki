import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'THORChain Wiki source-backed protocol encyclopedia';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#050807',
          color: '#f8fafc',
          padding: 72,
          fontFamily: 'Inter, Arial, sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div
            style={{
              width: 64,
              height: 64,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 12,
              border: '1px solid rgba(0, 212, 170, 0.45)',
              color: '#00d4aa',
              fontSize: 34,
              fontWeight: 800,
            }}
          >
            TC
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ color: '#94a3b8', fontSize: 26 }}>Source-backed protocol encyclopedia</span>
            <span style={{ color: '#00d4aa', fontSize: 24 }}>Midgard · THORNode · Mimir · RUNE · TCY</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ fontSize: 82, fontWeight: 800, letterSpacing: 0 }}>
            THORChain Wiki
          </div>
          <div style={{ maxWidth: 900, color: '#cbd5e1', fontSize: 34, lineHeight: 1.25 }}>
            Protocol architecture, economics, governance history, ecosystem context, and current-only live network status.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16, color: '#94a3b8', fontSize: 24 }}>
          <span>Official sources</span>
          <span>Curated records</span>
          <span>Explicit confidence labels</span>
        </div>
      </div>
    ),
    size
  );
}
