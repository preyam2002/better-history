import { describe, it, expect } from "vitest";
import {
	extractDomain,
	formatDuration,
	formatRelativeTime,
	formatDate,
	formatTime,
	getFaviconUrl,
	extractSnippet,
	groupByDate,
} from "./utils";

describe("extractDomain", () => {
	it("extracts domain from https URL", () => {
		expect(extractDomain("https://github.com/user/repo")).toBe("github.com");
	});

	it("extracts domain from http URL", () => {
		expect(extractDomain("http://example.com/path")).toBe("example.com");
	});

	it("handles URLs with ports", () => {
		expect(extractDomain("http://localhost:3000/app")).toBe("localhost");
	});

	it("handles subdomains", () => {
		expect(extractDomain("https://docs.github.com/en/actions")).toBe(
			"docs.github.com",
		);
	});

	it("returns raw string for invalid URLs", () => {
		expect(extractDomain("not-a-url")).toBe("not-a-url");
	});

	it("handles empty string", () => {
		expect(extractDomain("")).toBe("");
	});
});

describe("formatDuration", () => {
	it("formats seconds", () => {
		expect(formatDuration(30)).toBe("30s");
	});

	it("formats minutes", () => {
		expect(formatDuration(150)).toBe("2m");
	});

	it("formats hours with minutes", () => {
		expect(formatDuration(3720)).toBe("1h 2m");
	});

	it("formats exact hours", () => {
		expect(formatDuration(7200)).toBe("2h");
	});

	it("formats zero", () => {
		expect(formatDuration(0)).toBe("0s");
	});
});

describe("formatRelativeTime", () => {
	it("returns 'just now' for recent timestamps", () => {
		expect(formatRelativeTime(Date.now() - 5000)).toBe("just now");
	});

	it("returns minutes ago", () => {
		expect(formatRelativeTime(Date.now() - 5 * 60 * 1000)).toBe("5m ago");
	});

	it("returns hours ago", () => {
		expect(formatRelativeTime(Date.now() - 3 * 60 * 60 * 1000)).toBe(
			"3h ago",
		);
	});

	it("returns days ago", () => {
		expect(formatRelativeTime(Date.now() - 2 * 24 * 60 * 60 * 1000)).toBe(
			"2d ago",
		);
	});

	it("returns formatted date for old timestamps", () => {
		const old = Date.now() - 30 * 24 * 60 * 60 * 1000;
		const result = formatRelativeTime(old);
		// Should be a date string, not relative
		expect(result).not.toContain("ago");
		expect(result).toMatch(/\d/);
	});
});

describe("formatDate", () => {
	it("returns 'Today' for today", () => {
		expect(formatDate(Date.now())).toBe("Today");
	});

	it("returns 'Yesterday' for yesterday", () => {
		const yesterday = Date.now() - 24 * 60 * 60 * 1000;
		expect(formatDate(yesterday)).toBe("Yesterday");
	});

	it("returns formatted date for older dates", () => {
		const old = Date.now() - 7 * 24 * 60 * 60 * 1000;
		const result = formatDate(old);
		expect(result).not.toBe("Today");
		expect(result).not.toBe("Yesterday");
		expect(result.length).toBeGreaterThan(5);
	});
});

describe("formatTime", () => {
	it("formats time correctly", () => {
		const date = new Date(2026, 2, 22, 14, 30);
		const result = formatTime(date.getTime());
		expect(result).toContain("2:30");
	});
});

describe("getFaviconUrl", () => {
	it("returns provided favicon URL when available", () => {
		expect(getFaviconUrl("https://example.com/favicon.ico", "example.com")).toBe(
			"https://example.com/favicon.ico",
		);
	});

	it("returns null when no favicon provided", () => {
		expect(getFaviconUrl(undefined, "github.com")).toBeNull();
	});

	it("returns null for empty string favicon", () => {
		expect(getFaviconUrl("", "test.com")).toBeNull();
	});

	it("rejects non-http favicon URLs", () => {
		expect(getFaviconUrl("javascript:alert(1)", "evil.com")).toBeNull();
		expect(getFaviconUrl("data:image/png;base64,abc", "evil.com")).toBeNull();
	});
});

describe("extractSnippet", () => {
	it("returns null for empty query", () => {
		expect(extractSnippet("some text here", "")).toBeNull();
	});

	it("returns null when no match", () => {
		expect(extractSnippet("some text here", "nonexistent")).toBeNull();
	});

	it("returns snippet around match", () => {
		const text = "This is a long text about React hooks and how they work in modern applications.";
		const result = extractSnippet(text, "React");
		expect(result).not.toBeNull();
		expect(result).toContain("React");
	});

	it("adds ellipsis when match is in the middle", () => {
		const text = "A".repeat(100) + " React hooks " + "B".repeat(100);
		const result = extractSnippet(text, "React");
		expect(result).not.toBeNull();
		expect(result!.startsWith("...")).toBe(true);
		expect(result!.endsWith("...")).toBe(true);
	});

	it("handles empty text", () => {
		expect(extractSnippet("", "query")).toBeNull();
	});
});

describe("groupByDate", () => {
	it("groups items by date", () => {
		const now = Date.now();
		const items = [
			{ timestamp: now, id: 1 },
			{ timestamp: now - 1000, id: 2 },
			{ timestamp: now - 24 * 60 * 60 * 1000, id: 3 },
		];
		const groups = groupByDate(items);
		expect(groups.size).toBe(2);
	});

	it("handles empty array", () => {
		const groups = groupByDate([]);
		expect(groups.size).toBe(0);
	});

	it("keeps items in same day together", () => {
		const today = new Date();
		today.setHours(10, 0, 0, 0);
		const todayLater = new Date();
		todayLater.setHours(14, 0, 0, 0);

		const items = [
			{ timestamp: today.getTime(), id: 1 },
			{ timestamp: todayLater.getTime(), id: 2 },
		];
		const groups = groupByDate(items);
		expect(groups.size).toBe(1);
		const firstGroup = [...groups.values()][0]!;
		expect(firstGroup.length).toBe(2);
	});
});
