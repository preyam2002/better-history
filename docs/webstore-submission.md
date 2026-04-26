# Better History Web Store Submission Notes

## Single Purpose

Better History replaces the Chrome new tab page with a local workspace for searching, grouping, and understanding your browsing history.

## Permission Justifications

- `history`: imports recent Chrome history and powers the extension's history views.
- `tabs`: detects the active tab and reads current-tab metadata so visits can be tracked accurately.
- `idle`: ends sessions after inactivity or screen lock.
- `storage`: stores extension settings and transient import state.
- `alarms`: runs daily maintenance to prune old extracted text content.
- `http://*/*` and `https://*/*` content-script access: extracts page text locally and records scroll depth for user-facing search and analytics.

## Data Disclosure

- Data collected: browsing-history metadata, browsing activity, page text content, and user settings.
- Data purpose: local search, session grouping, analytics, and user-controlled history management.
- Data handling: all data stays on-device and is never sold or shared with third parties.
- User controls: export all data, clear all data, exclude domains, and configure text-retention limits.

## Reviewer Test Instructions

1. Install the unpacked extension from `dist/`.
2. Open a new tab. The Better History dashboard should replace Chrome's default new tab page.
3. Browse several `http` or `https` pages in separate tabs, scroll on at least one page, and then return to a new tab.
4. Confirm the Search view lists the visited pages and can match page text, title, or URL.
5. Confirm the Timeline view groups visits into sessions and shows durations.
6. Confirm the Analytics view shows total visits, total time, domains, and charts.
7. Open Settings and verify:
   - Export as JSON downloads local data.
   - Clear All Data removes stored visits and sessions.
   - Restore History rebuilds the local index from Chrome history when the dataset is empty.
   - Excluded domains stop future tracking for matching sites.
