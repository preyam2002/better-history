export const SESSION_GAP_MS = 30 * 60 * 1000; // 30 minutes

export const MAX_TEXT_CONTENT_LENGTH = 5000;

export const MAX_IMPORT_DAYS = 90;

export const SEARCH_DEBOUNCE_MS = 300;

export const SEARCH_SNIPPET_LENGTH = 150;

export const IMPORT_STATE_STORAGE_KEY = "historyImportState";

export const DEFAULT_SETTINGS = {
	sessionGapMinutes: 30,
	importCompleted: false,
	theme: "system" as const,
	excludedDomains: [] as string[],
	autoPruneMonths: null as number | null,
};

export const EXCLUDED_URL_PREFIXES = [
	"chrome://",
	"chrome-extension://",
	"about:",
	"edge://",
	"brave://",
	"devtools://",
	"view-source:",
	"data:",
	"blob:",
];

export const SAFE_URL_PROTOCOLS = ["https:", "http:"] as const;
