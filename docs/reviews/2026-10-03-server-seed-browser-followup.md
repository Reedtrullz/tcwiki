# Server-seed browser and narrow-screen follow-up

PR255/256 CI exposed stale accessibility fixture assumptions after the server operational seed, plus a real 320px layout defect. A failed browser refresh retains the dated seed; it does not erase it into a no-value heading. The deterministic fixture now first supplies a browser success, explicitly refreshes into failure and checks the retained dated context before auditing WCAG rules. Announcement and visible FormData tests wait for their actual hydrated state.

A temporary DOM overflow probe identified the node-action grid: its implicit minimum column was enlarged by the pinned 40-character revision. An explicit shrinking single-column grid, minimum-width zero and wrapped reference text correct the defect. The receipt timestamp also wraps within its parent. The temporary probe was removed.

The combined curated-feed candidate passed 695 units/63 files, types/content, both final builds/Next smoke and 16 desktop/mobile checks per actual runtime, covering degraded/loaded WCAG, 320px, announcements, FormData, route metadata, rendered links and updates. This commit contains only the four shared repair files and this review note; exact-head CI on PR255/256 remains a separate check after publication. Failed runs 37101196103 and 37101196685 are retained as evidence. No production, human screen-reader or merge/deployment claim.
