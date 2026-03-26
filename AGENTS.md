<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Bilingual UI (Arabic + English)

- All **user-visible UI** (labels, buttons, headings, errors, empty states, **`aria-label`s** where meaningful, toasts/alerts) must be **bilingual**: Arabic and English. **Do not hard-code copy** in components.
- Use the existing **`next-intl`** setup: add or update keys in **`messages/ar.json`** and **`messages/en.json`** (**same structure** in both files).
- Prefer **namespaced keys** (e.g. `rfq`, `listings`) and reuse shared keys under **`common`** when appropriate.
- **`app/layout.tsx`** (or equivalent) must keep correct **`lang`** and **`dir`** (`rtl` for `ar`, `ltr` for `en`) from the active locale.
- Language is chosen via the existing **persistent locale** mechanism (cookie / **`i18n/request.ts`**); **do not** introduce a second, conflicting i18n system.
- For **dynamic** strings (names, counts), use **ICU** placeholders (`{name}`, `{count}`) and **`t.rich`** only when markup is required.
- **Do not** ship a feature with strings in only one language unless the user **explicitly** asks for a single-locale exception.
