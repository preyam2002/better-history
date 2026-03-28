import { describe, it, expect } from "vitest";
import type { Visit } from "../../shared/types";
import {
	aggregateByDomain,
	aggregateByDay,
	aggregateByDayAndHour,
	aggregateByWeek,
} from "./analytics";

const makeVisit = (overrides: Partial<Visit> = {}): Visit => ({
	id: 1,
	url: "https://example.com",
	title: "Example",
	domain: "example.com",
	timestamp: Date.now(),
	duration: 60,
	scrollDepth: 0,
	...overrides,
});

describe("aggregateByDomain", () => {
	it("aggregates visits by domain", () => {
		const visits = [
			makeVisit({ domain: "github.com", duration: 120 }),
			makeVisit({ domain: "github.com", duration: 60 }),
			makeVisit({ domain: "stackoverflow.com", duration: 30 }),
		];
		const result = aggregateByDomain(visits);
		expect(result.length).toBe(2);
		expect(result[0]!.domain).toBe("github.com");
		expect(result[0]!.totalDuration).toBe(180);
		expect(result[0]!.visitCount).toBe(2);
		expect(result[1]!.domain).toBe("stackoverflow.com");
		expect(result[1]!.totalDuration).toBe(30);
	});

	it("sorts by total duration descending", () => {
		const visits = [
			makeVisit({ domain: "a.com", duration: 10 }),
			makeVisit({ domain: "b.com", duration: 100 }),
			makeVisit({ domain: "c.com", duration: 50 }),
		];
		const result = aggregateByDomain(visits);
		expect(result[0]!.domain).toBe("b.com");
		expect(result[1]!.domain).toBe("c.com");
		expect(result[2]!.domain).toBe("a.com");
	});

	it("handles empty array", () => {
		expect(aggregateByDomain([])).toEqual([]);
	});
});

describe("aggregateByDay", () => {
	it("groups visits by day", () => {
		const today = Date.now();
		const yesterday = today - 24 * 60 * 60 * 1000;
		const visits = [
			makeVisit({ timestamp: today, duration: 60 }),
			makeVisit({ timestamp: today - 1000, duration: 30 }),
			makeVisit({ timestamp: yesterday, duration: 120 }),
		];
		const result = aggregateByDay(visits);
		expect(result.length).toBe(2);
	});

	it("sums visits and duration per day", () => {
		const now = Date.now();
		const visits = [
			makeVisit({ timestamp: now, duration: 60 }),
			makeVisit({ timestamp: now - 1000, duration: 40 }),
		];
		const result = aggregateByDay(visits);
		expect(result.length).toBe(1);
		expect(result[0]!.visits).toBe(2);
		expect(result[0]!.duration).toBe(100);
	});

	it("handles empty array", () => {
		expect(aggregateByDay([])).toEqual([]);
	});
});

describe("aggregateByDayAndHour", () => {
	it("returns 168 cells (7 days × 24 hours)", () => {
		const result = aggregateByDayAndHour([]);
		expect(result.length).toBe(168);
	});

	it("counts visits in correct cell", () => {
		// Create a visit at a known day+hour
		const date = new Date(2026, 2, 23, 14, 0); // Monday 2pm
		const visits = [makeVisit({ timestamp: date.getTime() })];
		const result = aggregateByDayAndHour(visits);

		const mondayIdx = 0; // Monday = 0 in our system
		const hour14Cell = result.find(
			(c) => c.day === mondayIdx && c.hour === 14,
		);
		expect(hour14Cell?.count).toBe(1);
	});

	it("all empty cells have count 0", () => {
		const result = aggregateByDayAndHour([]);
		expect(result.every((c) => c.count === 0)).toBe(true);
	});
});

describe("aggregateByWeek", () => {
	it("groups visits by week", () => {
		const now = Date.now();
		const visits = [
			makeVisit({ timestamp: now, duration: 100 }),
			makeVisit({ timestamp: now - 1000, duration: 50 }),
			makeVisit({
				timestamp: now - 10 * 24 * 60 * 60 * 1000,
				duration: 200,
			}),
		];
		const result = aggregateByWeek(visits);
		expect(result.length).toBeGreaterThanOrEqual(2);
	});

	it("sums duration and visits per week", () => {
		const now = Date.now();
		const visits = [
			makeVisit({ timestamp: now, duration: 100 }),
			makeVisit({ timestamp: now - 1000, duration: 50 }),
		];
		const result = aggregateByWeek(visits);
		expect(result.length).toBe(1);
		expect(result[0]!.duration).toBe(150);
		expect(result[0]!.visits).toBe(2);
	});

	it("handles empty array", () => {
		expect(aggregateByWeek([])).toEqual([]);
	});
});
