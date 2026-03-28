import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../shared/db";
import type { Session, Visit } from "../../shared/types";

export interface SessionWithVisits extends Session {
	visits: Visit[];
}

export const useSessions = (days = 7) => {
	return useLiveQuery(async () => {
		const start = Date.now() - days * 24 * 60 * 60 * 1000;

		const sessions = await db.sessions
			.where("startTime")
			.aboveOrEqual(start)
			.reverse()
			.sortBy("startTime");

		const sessionIds = sessions
			.map((s) => s.id)
			.filter((id): id is number => id !== undefined);
		if (sessionIds.length === 0) return [];

		const allVisits = await db.visits
			.where("sessionId")
			.anyOf(sessionIds)
			.toArray();

		const visitsBySession = new Map<number, Visit[]>();
		for (const visit of allVisits) {
			if (visit.sessionId === undefined) continue;
			const list = visitsBySession.get(visit.sessionId) ?? [];
			list.push(visit);
			visitsBySession.set(visit.sessionId, list);
		}

		return sessions
			.filter((s) => s.id !== undefined)
			.map((session) => {
				const visits = (visitsBySession.get(session.id!) ?? []).sort(
					(a, b) => b.timestamp - a.timestamp,
				);
				return { ...session, visits };
			});
	}, [days]);
};
