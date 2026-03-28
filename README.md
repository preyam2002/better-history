# Better History

Chrome extension that replaces the default browser history page with full-text search, session grouping, and browsing analytics.

## Features

- **Full-text search** — search your history by page content, not just titles and URLs
- **Session grouping** — automatically groups browsing activity into logical sessions
- **Analytics dashboard** — time heatmap, top domains, weekly trends, daily usage charts
- **Date range filtering** — filter history by custom date ranges
- **Domain chips** — quick filter by domain with visual chips
- **Settings** — configurable session timeout, data retention, search behavior

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI | React 18, TypeScript, Tailwind CSS |
| Build | Vite + CRXJS (Chrome Extension) |
| Storage | Dexie (IndexedDB wrapper) |
| Linting | Biome |
| Testing | Vitest |

## Development

```bash
npm install
npm run dev    # Vite dev server with HMR
npm run build  # Production build → dist/
npm run test   # Vitest
npm run lint   # Biome check
```

Load the `dist/` folder as an unpacked extension in `chrome://extensions`.

## Architecture

```
src/
├── background/      # Service worker (history indexing)
├── content/         # Content script (page text extraction)
├── newtab/          # New tab page (replaces chrome://history)
│   ├── components/  # SearchBar, SessionGroup, VisitCard, analytics
│   ├── hooks/       # useSearch, useSessions, useAnalytics, useSettings
│   ├── views/       # SearchView, TimelineView, AnalyticsView, Settings
│   └── lib/         # search engine, analytics calculations
└── shared/          # DB schema, types, constants
```

## License

MIT — Built by [Preyam](https://github.com/preyam2002)
