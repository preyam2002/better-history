import { describe, expect, it } from "vitest";
import {
	DEFAULT_SETTINGS,
	EXCLUDED_URL_PREFIXES,
	MAX_IMPORT_DAYS,
	MAX_TEXT_CONTENT_LENGTH,
	SESSION_GAP_MS,
} from "./constants";

describe("constants", () => {
	it("SESSION_GAP_MS is 30 minutes in milliseconds", () => {
		expect(SESSION_GAP_MS).toBe(30 * 60 * 1000);
	});

	it("MAX_TEXT_CONTENT_LENGTH is reasonable", () => {
		expect(MAX_TEXT_CONTENT_LENGTH).toBe(5000);
		expect(MAX_TEXT_CONTENT_LENGTH).toBeGreaterThan(100);
	});

	it("MAX_IMPORT_DAYS is 90", () => {
		expect(MAX_IMPORT_DAYS).toBe(90);
	});

	it("EXCLUDED_URL_PREFIXES includes chrome:// and others", () => {
		expect(EXCLUDED_URL_PREFIXES).toContain("chrome://");
		expect(EXCLUDED_URL_PREFIXES).toContain("chrome-extension://");
		expect(EXCLUDED_URL_PREFIXES).toContain("about:");
		expect(EXCLUDED_URL_PREFIXES).toContain("data:");
	});

	it("DEFAULT_SETTINGS has expected shape", () => {
		expect(DEFAULT_SETTINGS.sessionGapMinutes).toBe(30);
		expect(DEFAULT_SETTINGS.importCompleted).toBe(false);
		expect(DEFAULT_SETTINGS.theme).toBe("system");
		expect(DEFAULT_SETTINGS.excludedDomains).toEqual([]);
	});
});
