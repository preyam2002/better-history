# Better History

Better History is a Manifest V3 Chrome extension that replaces the new tab page with a local history workspace. It imports recent Chrome history, tracks new visits, extracts page text locally for search, groups sessions, and shows browsing analytics.

## Privacy

- All browsing data stays on-device in IndexedDB and Chrome storage.
- No browsing history or extracted page text is sent to external servers.
- Users can export or delete all stored data from Settings.

The Web Store privacy-policy page is in [docs/privacy-policy.html](docs/privacy-policy.html).

## Development

```bash
npm install
npm run lint
npm test
npm run build
```

## Release

```bash
npm run package:extension
```

That creates a zip in `release/` for Chrome Web Store upload.

## Web Store Submission

Copy-ready privacy declarations, permission justifications, and reviewer test steps are in [docs/webstore-submission.md](docs/webstore-submission.md).
