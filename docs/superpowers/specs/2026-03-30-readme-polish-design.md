# README Polish Design Spec

## Goal

Rewrite `README.md` (English) and create `README.zh-CN.md` (Chinese) as product-focused, bilingual documentation for public GitHub release + Chrome Web Store.

## Structure

Both files follow identical structure with language switcher at top:

1. **Badges** — version, license, Chrome/Firefox compatibility
2. **Language switcher** — `[English](README.md) | [中文](README.zh-CN.md)`
3. **Tagline** — One-liner: "AI-powered summaries for Reddit posts and comments"
4. **Screenshots** — Placeholder images for: post summary, comment summary, dark mode, popup, onboarding
5. **Features** — Updated list reflecting all new polish: dark mode, onboarding, structured output, copy button, collapsible panel, streaming, BYO API key, custom prompts, model discovery
6. **Installation** — Chrome Web Store link + manual build from source + Firefox build
7. **Configuration** — Quick setup (popup) + full settings (options page)
8. **Privacy & Permissions** — Zero collection, local storage only, direct API calls, permission table
9. **Development** — Dev setup, architecture overview, adding features
10. **License** — MIT

## Key Content Updates from Polish Work

- Dark mode auto-detection (follows Reddit theme)
- First-run onboarding banner
- Structured prompt output (Key Point/Context/Questions for posts; Themes/Consensus/Debate/Sentiment for comments)
- Copy button in summary footer
- Collapsible summary panel
- Popup redesigned as status dashboard
- Model auto-discovery via Fetch button

## Decisions

- Separate files for EN/CN (not interleaved)
- Screenshot placeholders (not actual images yet)
- Architecture section at bottom (product focus first)
- CWS listing copy stays in `CWS_LISTING.md` (README links to it)
