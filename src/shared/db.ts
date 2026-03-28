import Dexie, { type EntityTable } from "dexie";
import type { Visit, Session } from "./types";

const db = new Dexie("BetterHistoryDB") as Dexie & {
	visits: EntityTable<Visit, "id">;
	sessions: EntityTable<Session, "id">;
};

db.version(1).stores({
	visits:
		"++id, url, domain, timestamp, duration, sessionId, [domain+timestamp]",
	sessions: "++id, startTime, endTime, topDomain",
});

export { db };
