import Dexie, { type EntityTable } from "dexie";
import type { Session, Visit } from "./types";

const db = new Dexie("BetterHistoryDB") as Dexie & {
	visits: EntityTable<Visit, "id">;
	sessions: EntityTable<Session, "id">;
};

db.version(1).stores({
	visits:
		"++id, url, domain, timestamp, duration, sessionId, [domain+timestamp]",
	sessions: "++id, startTime, endTime, topDomain",
});

/** Recalculate a session's metadata after visits are added/removed.
 *  Deletes the session if it has no remaining visits. */
export const refreshSession = async (sessionId: number) => {
	const visits = await db.visits.where("sessionId").equals(sessionId).toArray();
	if (visits.length === 0) {
		await db.sessions.delete(sessionId);
		return;
	}
	const domainCounts = new Map<string, number>();
	let topDomain = "";
	let maxCount = 0;
	for (const v of visits) {
		const count = (domainCounts.get(v.domain) ?? 0) + 1;
		domainCounts.set(v.domain, count);
		if (count > maxCount) {
			topDomain = v.domain;
			maxCount = count;
		}
	}
	const timestamps = visits.map((v) => v.timestamp);
	await db.sessions.update(sessionId, {
		visitCount: visits.length,
		startTime: Math.min(...timestamps),
		endTime: Math.max(...timestamps),
		topDomain,
	});
};

export { db };
