---
name: Built-in Preview verification
description: User expectation and the distinction between a healthy app and a working embedded preview.
---

The user requires the site to be viewable in the built-in Preview. An external link is not a substitute.

**Why:** The user said「我需要這裡可以看」after the embedded Preview remained unreachable despite a working external link.

**How to apply:** Treat the embedded Preview as the primary viewing surface when diagnosing accessibility problems.

A successful local screenshot or a healthy development URL without a port does not establish that the URL selected in Preview works.

**Why:** The embedded Preview retained a development URL with `:5000` that failed while the default development-domain URL served the same page successfully. Repeated service restarts did not correct that URL mismatch.

**How to apply:** Verify the exact external address shown in Preview, including any port suffix, alongside the local listener and default URL. Keep development-preview accommodations separate from production startup.