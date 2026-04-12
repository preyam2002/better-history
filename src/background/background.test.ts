import {
	EXCLUDED_URL_PREFIXES,
	MAX_TEXT_CONTENT_LENGTH,
	SESSION_GAP_MS,
} from "../shared/constants";
import { isValidUrl, sanitizeText } from "./helpers";

describe("sanitizeText", () => {
	it("returns normal text unchanged", () => {
		expect(sanitizeText("Hello world")).toBe("Hello world");
	});

	it("returns empty string for empty input", () => {
		expect(sanitizeText("")).toBe("");
	});

	it("returns empty string for whitespace-only input", () => {
		expect(sanitizeText("   ")).toBe("");
	});

	it("strips control characters (\\x00-\\x08, \\x0B, \\x0C, \\x0E-\\x1F, \\x7F)", () => {
		expect(sanitizeText("hello\x00world")).toBe("helloworld");
		expect(sanitizeText("a\x01b\x02c")).toBe("abc");
		expect(sanitizeText("test\x07bell")).toBe("testbell");
		expect(sanitizeText("del\x7Fete")).toBe("delete");
		expect(sanitizeText("\x0Bvertical\x0Ctab")).toBe("verticaltab");
	});

	it("preserves newline (\\n) and tab (\\t) but collapses them as whitespace", () => {
		expect(sanitizeText("hello\nworld")).toBe("hello world");
		expect(sanitizeText("hello\tworld")).toBe("hello world");
		expect(sanitizeText("a\n\n\nb")).toBe("a b");
	});

	it("strips zero-width characters", () => {
		expect(sanitizeText("hello\u200Bworld")).toBe("helloworld");
		expect(sanitizeText("test\u200Cvalue")).toBe("testvalue");
		expect(sanitizeText("a\u200Db")).toBe("ab");
		expect(sanitizeText("x\u200Ey")).toBe("xy");
		expect(sanitizeText("m\u200Fn")).toBe("mn");
		expect(sanitizeText("foo\uFEFFbar")).toBe("foobar");
	});

	it("strips line/paragraph separators (\\u2028-\\u202F)", () => {
		expect(sanitizeText("line\u2028sep")).toBe("linesep");
		expect(sanitizeText("para\u2029sep")).toBe("parasep");
		expect(sanitizeText("narrow\u202Fspace")).toBe("narrowspace");
	});

	it("collapses multiple spaces into one", () => {
		expect(sanitizeText("hello    world")).toBe("hello world");
		expect(sanitizeText("  leading  and  trailing  ")).toBe(
			"leading and trailing",
		);
	});

	it("trims leading and trailing whitespace", () => {
		expect(sanitizeText("  hello  ")).toBe("hello");
		expect(sanitizeText("\t\nhello\n\t")).toBe("hello");
	});

	it("truncates to MAX_TEXT_CONTENT_LENGTH", () => {
		const longText = "a".repeat(MAX_TEXT_CONTENT_LENGTH + 1000);
		const result = sanitizeText(longText);
		expect(result.length).toBe(MAX_TEXT_CONTENT_LENGTH);
	});

	it("does not truncate text shorter than MAX_TEXT_CONTENT_LENGTH", () => {
		const shortText = "a".repeat(MAX_TEXT_CONTENT_LENGTH - 1);
		expect(sanitizeText(shortText).length).toBe(MAX_TEXT_CONTENT_LENGTH - 1);
	});

	it("text exactly at MAX_TEXT_CONTENT_LENGTH stays the same length", () => {
		const exact = "b".repeat(MAX_TEXT_CONTENT_LENGTH);
		expect(sanitizeText(exact).length).toBe(MAX_TEXT_CONTENT_LENGTH);
	});

	it("handles combined control chars, zero-width, and whitespace", () => {
		const messy = "\x00\u200B  hello \x07 \uFEFF  world  \x1F";
		expect(sanitizeText(messy)).toBe("hello world");
	});

	it("control chars between words without spaces are joined", () => {
		expect(sanitizeText("foo\x01bar")).toBe("foobar");
	});

	it("control chars surrounded by spaces still collapse", () => {
		expect(sanitizeText("foo \x01 bar")).toBe("foo bar");
	});

	it("handles unicode text correctly", () => {
		expect(sanitizeText("こんにちは世界")).toBe("こんにちは世界");
		expect(sanitizeText("  émojis 🎉  are  fine  ")).toBe("émojis 🎉 are fine");
	});
});

describe("isValidUrl", () => {
	it("accepts https URLs", () => {
		expect(isValidUrl("https://example.com")).toBe(true);
		expect(isValidUrl("https://example.com/path?q=1#hash")).toBe(true);
		expect(isValidUrl("https://sub.domain.example.com")).toBe(true);
	});

	it("accepts http URLs", () => {
		expect(isValidUrl("http://example.com")).toBe(true);
		expect(isValidUrl("http://localhost:3000")).toBe(true);
		expect(isValidUrl("http://192.168.1.1")).toBe(true);
	});

	it("rejects ftp URLs", () => {
		expect(isValidUrl("ftp://files.example.com")).toBe(false);
	});

	it("rejects data URLs", () => {
		expect(isValidUrl("data:text/html,<h1>hi</h1>")).toBe(false);
	});

	it("rejects javascript URLs", () => {
		expect(isValidUrl("javascript:alert(1)")).toBe(false);
	});

	it("rejects chrome-extension URLs", () => {
		expect(isValidUrl("chrome-extension://abc123/popup.html")).toBe(false);
	});

	it("rejects chrome:// URLs", () => {
		expect(isValidUrl("chrome://settings")).toBe(false);
	});

	it("rejects about: URLs", () => {
		expect(isValidUrl("about:blank")).toBe(false);
	});

	it("rejects blob URLs", () => {
		expect(isValidUrl("blob:https://example.com/uuid")).toBe(false);
	});

	it("rejects file URLs", () => {
		expect(isValidUrl("file:///home/user/doc.html")).toBe(false);
	});

	it("rejects empty string", () => {
		expect(isValidUrl("")).toBe(false);
	});

	it("rejects malformed URLs", () => {
		expect(isValidUrl("not-a-url")).toBe(false);
		expect(isValidUrl("://missing-protocol")).toBe(false);
		expect(isValidUrl("http//no-colon.com")).toBe(false);
	});

	it("rejects URLs with whitespace only", () => {
		expect(isValidUrl("   ")).toBe(false);
	});
});

describe("EXCLUDED_URL_PREFIXES", () => {
	it("contains chrome:// prefix", () => {
		expect(EXCLUDED_URL_PREFIXES).toContain("chrome://");
	});

	it("contains chrome-extension:// prefix", () => {
		expect(EXCLUDED_URL_PREFIXES).toContain("chrome-extension://");
	});

	it("contains about: prefix", () => {
		expect(EXCLUDED_URL_PREFIXES).toContain("about:");
	});

	it("contains edge:// prefix", () => {
		expect(EXCLUDED_URL_PREFIXES).toContain("edge://");
	});

	it("contains devtools:// prefix", () => {
		expect(EXCLUDED_URL_PREFIXES).toContain("devtools://");
	});

	it("contains data: prefix", () => {
		expect(EXCLUDED_URL_PREFIXES).toContain("data:");
	});

	it("contains blob: prefix", () => {
		expect(EXCLUDED_URL_PREFIXES).toContain("blob:");
	});

	it("correctly matches URLs with startsWith", () => {
		const testUrls = [
			"chrome://settings",
			"chrome-extension://abc/popup.html",
			"about:blank",
			"edge://flags",
			"brave://settings",
			"devtools://devtools/bundled/inspector.html",
			"view-source:https://example.com",
			"data:text/html,test",
			"blob:https://example.com/uuid",
		];

		for (const url of testUrls) {
			const excluded = EXCLUDED_URL_PREFIXES.some((prefix) =>
				url.startsWith(prefix),
			);
			expect(excluded).toBe(true);
		}
	});

	it("does not match regular http/https URLs", () => {
		const safeUrls = [
			"https://example.com",
			"http://localhost:3000",
			"https://chrome.google.com/webstore",
		];

		for (const url of safeUrls) {
			const excluded = EXCLUDED_URL_PREFIXES.some((prefix) =>
				url.startsWith(prefix),
			);
			expect(excluded).toBe(false);
		}
	});
});

describe("SESSION_GAP_MS", () => {
	it("equals 30 minutes in milliseconds", () => {
		expect(SESSION_GAP_MS).toBe(30 * 60 * 1000);
		expect(SESSION_GAP_MS).toBe(1_800_000);
	});

	it("can determine if two timestamps are within the same session", () => {
		const t1 = Date.now();
		const t2 = t1 + 10 * 60 * 1000; // 10 minutes later
		expect(t2 - t1 < SESSION_GAP_MS).toBe(true);
	});

	it("can determine if two timestamps are in different sessions", () => {
		const t1 = Date.now();
		const t2 = t1 + 31 * 60 * 1000; // 31 minutes later
		expect(t2 - t1 < SESSION_GAP_MS).toBe(false);
	});

	it("boundary: exactly 30 minutes is NOT within the gap", () => {
		const t1 = Date.now();
		const t2 = t1 + SESSION_GAP_MS;
		// The check in the codebase is `timestamp - session.endTime < gapMs`
		// so exactly equal means it's NOT within the session
		expect(t2 - t1 < SESSION_GAP_MS).toBe(false);
	});

	it("boundary: one ms less than 30 minutes IS within the gap", () => {
		const t1 = Date.now();
		const t2 = t1 + SESSION_GAP_MS - 1;
		expect(t2 - t1 < SESSION_GAP_MS).toBe(true);
	});
});

describe("MAX_TEXT_CONTENT_LENGTH", () => {
	it("equals 5000", () => {
		expect(MAX_TEXT_CONTENT_LENGTH).toBe(5000);
	});
});
