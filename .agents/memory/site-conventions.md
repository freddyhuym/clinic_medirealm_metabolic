---
name: Site conventions
description: Durable rules for the 纖顏醫境 static site (cache busting, CSS compat, AI image prompts)
---

- **Cache busting**: every styles.css change requires bumping `?v=N` in BOTH `public/index.html` and `public/knowledge.html`. **Why:** stale CSS repeatedly confused visual verification. Currently v=9.
- **No `:has()` in CSS**: render explicit state classes (e.g. `.has-photo`) from JS instead. **Why:** code review flagged legacy-browser fallback breakage.
- **AI-generated interior/space images**: always include "absolutely no text, no signage, no logos" in prompts. **Why:** the model invents fake clinic names/simplified-Chinese wall text, violating the brand rule against fabricated logos/content.
- Brand rules: no fabricated addresses/medical claims/prices; only 初纖顏(信義) operating, 沐/森 are 籌備中; replies in 繁體中文.
