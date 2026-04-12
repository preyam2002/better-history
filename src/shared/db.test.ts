import { beforeEach, describe, expect, it } from "vitest";
import { db } from "./db";
import type { Session, Visit } from "./types";

describe("database", () => {
	beforeEach(async () => {
		await db.visits.clear();
		await db.sessions.clear();
	});

	describe("visits table", () => {
		it("inserts and retrieves a visit", async () => {
			const visit: Visit = {
				url: "https://github.com/user/repo",
				title: "GitHub Repo",
				domain: "github.com",
				timestamp: Date.now(),
				duration: 120,
				scrollDepth: 75,
				textContent: "README content here",
			};

			const id = await db.visits.add(visit);
			const retrieved = await db.visits.get(id);

			expect(retrieved).toBeDefined();
			expect(retrieved!.url).toBe(visit.url);
			expect(retrieved!.title).toBe(visit.title);
			expect(retrieved!.domain).toBe(visit.domain);
			expect(retrieved!.textContent).toBe(visit.textContent);
		});

		it("queries by domain index", async () => {
			await db.visits.bulkAdd([
				{
					url: "https://a.com/1",
					title: "A1",
					domain: "a.com",
					timestamp: 1,
					duration: 0,
					scrollDepth: 0,
				},
				{
					url: "https://b.com/1",
					title: "B1",
					domain: "b.com",
					timestamp: 2,
					duration: 0,
					scrollDepth: 0,
				},
				{
					url: "https://a.com/2",
					title: "A2",
					domain: "a.com",
					timestamp: 3,
					duration: 0,
					scrollDepth: 0,
				},
			]);

			const results = await db.visits.where("domain").equals("a.com").toArray();
			expect(results.length).toBe(2);
			expect(results.every((v) => v.domain === "a.com")).toBe(true);
		});

		it("queries by timestamp range", async () => {
			const now = Date.now();
			await db.visits.bulkAdd([
				{
					url: "https://a.com/1",
					title: "Old",
					domain: "a.com",
					timestamp: now - 100000,
					duration: 0,
					scrollDepth: 0,
				},
				{
					url: "https://a.com/2",
					title: "Mid",
					domain: "a.com",
					timestamp: now - 50000,
					duration: 0,
					scrollDepth: 0,
				},
				{
					url: "https://a.com/3",
					title: "New",
					domain: "a.com",
					timestamp: now,
					duration: 0,
					scrollDepth: 0,
				},
			]);

			const results = await db.visits
				.where("timestamp")
				.between(now - 60000, now, true, true)
				.toArray();
			expect(results.length).toBe(2);
		});

		it("queries by compound [domain+timestamp] index", async () => {
			const now = Date.now();
			await db.visits.bulkAdd([
				{
					url: "https://a.com/1",
					title: "A",
					domain: "a.com",
					timestamp: now - 100000,
					duration: 0,
					scrollDepth: 0,
				},
				{
					url: "https://a.com/2",
					title: "A",
					domain: "a.com",
					timestamp: now,
					duration: 0,
					scrollDepth: 0,
				},
				{
					url: "https://b.com/1",
					title: "B",
					domain: "b.com",
					timestamp: now,
					duration: 0,
					scrollDepth: 0,
				},
			]);

			const results = await db.visits
				.where("[domain+timestamp]")
				.between(["a.com", now - 60000], ["a.com", now], true, true)
				.toArray();
			expect(results.length).toBe(1);
			expect(results[0]!.domain).toBe("a.com");
		});

		it("queries by sessionId", async () => {
			await db.visits.bulkAdd([
				{
					url: "https://a.com/1",
					title: "A",
					domain: "a.com",
					timestamp: 1,
					duration: 0,
					scrollDepth: 0,
					sessionId: 1,
				},
				{
					url: "https://a.com/2",
					title: "B",
					domain: "a.com",
					timestamp: 2,
					duration: 0,
					scrollDepth: 0,
					sessionId: 2,
				},
				{
					url: "https://a.com/3",
					title: "C",
					domain: "a.com",
					timestamp: 3,
					duration: 0,
					scrollDepth: 0,
					sessionId: 1,
				},
			]);

			const results = await db.visits.where("sessionId").equals(1).toArray();
			expect(results.length).toBe(2);
		});

		it("updates a visit", async () => {
			const id = await db.visits.add({
				url: "https://a.com",
				title: "A",
				domain: "a.com",
				timestamp: Date.now(),
				duration: 0,
				scrollDepth: 0,
			});

			await db.visits.update(id, { duration: 120, scrollDepth: 80 });
			const updated = await db.visits.get(id);
			expect(updated!.duration).toBe(120);
			expect(updated!.scrollDepth).toBe(80);
		});

		it("deletes a visit", async () => {
			const id = await db.visits.add({
				url: "https://a.com",
				title: "A",
				domain: "a.com",
				timestamp: Date.now(),
				duration: 0,
				scrollDepth: 0,
			});

			await db.visits.delete(id);
			const result = await db.visits.get(id);
			expect(result).toBeUndefined();
		});
	});

	describe("sessions table", () => {
		it("inserts and retrieves a session", async () => {
			const session: Session = {
				startTime: Date.now() - 3600000,
				endTime: Date.now(),
				visitCount: 10,
				topDomain: "github.com",
			};

			const id = await db.sessions.add(session);
			const retrieved = await db.sessions.get(id);

			expect(retrieved).toBeDefined();
			expect(retrieved!.startTime).toBe(session.startTime);
			expect(retrieved!.visitCount).toBe(10);
			expect(retrieved!.topDomain).toBe("github.com");
		});

		it("queries by startTime", async () => {
			const now = Date.now();
			await db.sessions.bulkAdd([
				{ startTime: now - 100000, endTime: now - 50000, visitCount: 5 },
				{ startTime: now - 10000, endTime: now, visitCount: 3 },
			]);

			const results = await db.sessions
				.where("startTime")
				.aboveOrEqual(now - 20000)
				.toArray();
			expect(results.length).toBe(1);
		});

		it("updates session visit count", async () => {
			const id = await db.sessions.add({
				startTime: Date.now(),
				endTime: Date.now(),
				visitCount: 1,
			});

			await db.sessions.update(id, {
				visitCount: 5,
				endTime: Date.now() + 1000,
			});
			const updated = await db.sessions.get(id);
			expect(updated!.visitCount).toBe(5);
		});
	});
});
