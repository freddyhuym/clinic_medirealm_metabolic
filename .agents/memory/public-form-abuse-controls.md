---
name: Public form abuse controls
description: Security constraints for rate limiting unauthenticated forms behind Replit's reverse proxy.
---

Do not treat `X-Forwarded-For` as a verified client identity for rate limiting, and do not assume the socket peer distinguishes public users behind Replit's proxy.

**Why:** Replit does not provide a custom unspoofable original-client-IP header, and user-supplied forwarding values are not guaranteed to be stripped. Trusting them permits bypass; using only the proxy peer can globally throttle unrelated users.

**How to apply:** For unauthenticated public forms, combine bounded request/write limits, body-size limits, strict validation, honeypots, and duplicate suppression. If stronger per-user abuse resistance is required, configure a provider-verified challenge or edge control rather than inventing trust in request headers.