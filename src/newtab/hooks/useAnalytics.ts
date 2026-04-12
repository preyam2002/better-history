import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../shared/db";
import {
	aggregateByDay,
	aggregateByDayAndHour,
	aggregateByDomain,
	aggregateByWeek,
} from "../lib/analytics";

export const useAnalytics = (range: { start: number; end: number }) => {
	return useLiveQuery(async () => {
		const visits = await db.visits
			.where("timestamp")
			.between(range.start, range.end, true, true)
			.toArray();

		return {
			topDomains: aggregateByDomain(visits).slice(0, 10),
			dailyUsage: aggregateByDay(visits),
			heatmap: aggregateByDayAndHour(visits),
			weeklyTrend: aggregateByWeek(visits),
			totalTime: visits.reduce((sum, v) => sum + v.duration, 0),
			totalVisits: visits.length,
			uniqueDomains: new Set(visits.map((v) => v.domain)).size,
		};
	}, [range.start, range.end]);
};
