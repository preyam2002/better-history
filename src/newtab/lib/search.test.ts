import { describe, expect, it } from "vitest";
import type { SearchFilters, Visit } from "../../shared/types";
import { applyFilters, extractSnippet, matchesQuery } from "./search";

const makeVisit = (overrides: Partial<Visit> = {}): Visit => ({
	id: 1,
	url: "https://example.com/page",
	title: "Example Page",
	domain: "example.com",
	timestamp: Date.now(),
	duration: 60,
	scrollDepth: 50,
	...overrides,
});

describe("matchesQuery", () => {
	it("returns true for empty query", () => {
		expect(matchesQuery(makeVisit(), "")).toBe(true);
	});

	it("matches title", () => {
		expect(
			matchesQuery(makeVisit({ title: "React Hooks Guide" }), "react"),
		).toBe(true);
	});

	it("matches URL", () => {
		expect(
			matchesQuery(makeVisit({ url: "https://github.com/react" }), "github"),
		).toBe(true);
	});

	it("matches textContent", () => {
		expect(
			matchesQuery(
				makeVisit({
					textContent: "This article discusses TypeScript generics",
				}),
				"generics",
			),
		).toBe(true);
	});

	it("is case insensitive", () => {
		expect(matchesQuery(makeVisit({ title: "REACT Hooks" }), "react")).toBe(
			true,
		);
	});

	it("supports multi-word AND search", () => {
		const visit = makeVisit({
			title: "React Hooks Tutorial",
			textContent: "Learn about useState and useEffect hooks in React",
		});
		expect(matchesQuery(visit, "react hooks")).toBe(true);
		expect(matchesQuery(visit, "react tutorial")).toBe(true);
		expect(matchesQuery(visit, "react angular")).toBe(false);
	});

	it("ignores extra whitespace in query", () => {
		expect(
			matchesQuery(makeVisit({ title: "React Hooks" }), "  react   hooks  "),
		).toBe(true);
	});

	it("returns false when no match", () => {
		expect(matchesQuery(makeVisit(), "nonexistent-term-xyz")).toBe(false);
	});

	it("handles visit without textContent", () => {
		const visit = makeVisit({ textContent: undefined });
		expect(matchesQuery(visit, "anything")).toBe(false);
	});
});

describe("extractSnippet", () => {
	it("returns null for empty query", () => {
		expect(extractSnippet(makeVisit(), "")).toBeNull();
	});

	it("extracts snippet from textContent", () => {
		const visit = makeVisit({
			textContent:
				"This is a comprehensive guide to React hooks including useState, useEffect, and custom hooks.",
		});
		const snippet = extractSnippet(visit, "hooks");
		expect(snippet).not.toBeNull();
		expect(snippet).toContain("hooks");
	});

	it("falls back to title when textContent has no match", () => {
		const visit = makeVisit({
			title: "React Hooks Guide",
			textContent: "No matching content here at all",
		});
		const snippet = extractSnippet(visit, "hooks");
		expect(snippet).toBe("React Hooks Guide");
	});

	it("returns null when nothing matches", () => {
		const visit = makeVisit({
			title: "Page Title",
			textContent: "Some content",
		});
		expect(extractSnippet(visit, "nonexistent")).toBeNull();
	});

	it("uses first term for multi-word query snippet", () => {
		const visit = makeVisit({
			textContent: "React is a library. Hooks are great.",
		});
		const snippet = extractSnippet(visit, "react hooks");
		expect(snippet).not.toBeNull();
		expect(snippet!.toLowerCase()).toContain("react");
	});
});

describe("applyFilters", () => {
	const visits = [
		makeVisit({
			id: 1,
			domain: "github.com",
			duration: 120,
			timestamp: Date.now(),
		}),
		makeVisit({
			id: 2,
			domain: "stackoverflow.com",
			duration: 30,
			timestamp: Date.now() - 1000,
		}),
		makeVisit({
			id: 3,
			domain: "github.com",
			duration: 60,
			timestamp: Date.now() - 2000,
			textContent: "TypeScript generics explained",
		}),
		makeVisit({
			id: 4,
			domain: "youtube.com",
			duration: 300,
			timestamp: Date.now() - 3000,
		}),
	];

	const baseFilters: SearchFilters = {
		query: "",
		domains: [],
		dateRange: null,
		minDuration: null,
		sortBy: "recent",
	};

	it("returns all visits with no filters", () => {
		const result = applyFilters(visits, baseFilters);
		expect(result.length).toBe(4);
	});

	it("filters by query", () => {
		const result = applyFilters(visits, { ...baseFilters, query: "generics" });
		expect(result.length).toBe(1);
		expect(result[0]!.id).toBe(3);
	});

	it("filters by domain", () => {
		const result = applyFilters(visits, {
			...baseFilters,
			domains: ["github.com"],
		});
		expect(result.length).toBe(2);
		expect(result.every((v) => v.domain === "github.com")).toBe(true);
	});

	it("filters by multiple domains", () => {
		const result = applyFilters(visits, {
			...baseFilters,
			domains: ["github.com", "youtube.com"],
		});
		expect(result.length).toBe(3);
	});

	it("filters by minimum duration", () => {
		const result = applyFilters(visits, { ...baseFilters, minDuration: 100 });
		expect(result.length).toBe(2);
		expect(result.every((v) => v.duration >= 100)).toBe(true);
	});

	it("sorts by recent (default)", () => {
		const result = applyFilters(visits, { ...baseFilters, sortBy: "recent" });
		for (let i = 1; i < result.length; i++) {
			expect(result[i]!.timestamp).toBeLessThanOrEqual(
				result[i - 1]!.timestamp,
			);
		}
	});

	it("sorts by duration", () => {
		const result = applyFilters(visits, { ...baseFilters, sortBy: "duration" });
		for (let i = 1; i < result.length; i++) {
			expect(result[i]!.duration).toBeLessThanOrEqual(result[i - 1]!.duration);
		}
	});

	it("combines domain + duration filters", () => {
		const result = applyFilters(visits, {
			...baseFilters,
			domains: ["github.com"],
			minDuration: 100,
		});
		expect(result.length).toBe(1);
		expect(result[0]!.id).toBe(1);
	});

	it("combines query + domain filters", () => {
		const result = applyFilters(visits, {
			...baseFilters,
			query: "generics",
			domains: ["github.com"],
		});
		expect(result.length).toBe(1);
		expect(result[0]!.id).toBe(3);
	});
});
