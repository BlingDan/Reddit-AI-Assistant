# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-03-30

### Added
- One-click AI summaries for Reddit posts and comment threads
- Real-time streaming with incremental markdown rendering
- Dark mode support (follows Reddit's theme)
- First-run onboarding banner
- Copy button for summaries
- Collapsible summary panel
- Summary caching (LRU, max 50 entries)
- Model auto-discovery from API endpoint
- Customizable prompt templates with bilingual presets (English/中文)
- Chrome (MV3) and Firefox (MV2) support
- Status dashboard popup with quick settings

### Security
- DOMPurify sanitization for all markdown-rendered content (XSS prevention)
- HTTPS-only endpoint enforcement (localhost exception for development)
- Request timeout (30s) to prevent hanging
- Sanitized error messages (no internal info leakage)
- Cache lock mechanism for concurrent access safety

### Technical
- Vue 3 for popup and options pages
- WXT framework for cross-browser extension development
- TypeScript throughout
- OpenAI-compatible streaming API client