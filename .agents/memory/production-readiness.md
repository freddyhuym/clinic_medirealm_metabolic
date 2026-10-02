---
name: Production readiness checks
description: Verification boundaries for the M4 landing page and global search-domain settings.
---

Validate the actual page identity and asset formats, not only HTTP status.

**Why:** A live M4 audit found the requested page and missing image/CSS URLs returning HTTP 200 with old homepage HTML. A successful deployment status likewise did not prove the current M4 version was live.

**How to apply:** Obtain the current production URL from deployment metadata on each audit. Inspect page headings, metadata and structured data; check image/CSS MIME and file signatures. Treat development success as separate from production readiness.

Do not change global search-domain settings as part of an M4-only verification without confirming the intended public domain and permission to affect other pages.

**Why:** The user limited the audit to M4 and prohibited modifying other clinics. A canonical/robots/sitemap mismatch may involve a global domain choice, not merely an isolated M4 change.

**How to apply:** Report the mismatch and its impact, ask for the intended public domain before a cross-site fix, and recheck after user-initiated publishing. Keep crawlability, indexing, ranking and AI citations as separate claims requiring separate evidence.