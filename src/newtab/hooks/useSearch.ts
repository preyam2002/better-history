import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../shared/db";
import type { SearchFilters } from "../../shared/types";
import { applyFilters } from "../lib/search";

export const useSearch = (filters: SearchFilters) => {
	return useLiveQuery(async () => {
		const now = Date.now();
		const start = filters.dateRange?.start ?? now - 30 * 24 * 60 * 60 * 1000;
		const end = filters.dateRange?.end ?? now;

		let visits;
		if (filters.domains.length === 1) {
			visits = await db.visits
				.where("[domain+timestamp]")
				.between(
					[filters.domains[0], start],
					[filters.domains[0], end],
					true,
					true,
				)
				.reverse()
				.limit(1000)
				.toArray();
		} else {
			visits = await db.visits
				.where("timestamp")
				.between(start, end, true, true)
				.reverse()
				.limit(1000)
				.toArray();
		}

		return applyFilters(visits, filters);
	}, [
		filters.query,
		filters.domains.join(","),
		filters.dateRange?.start,
		filters.dateRange?.end,
		filters.minDuration,
		filters.sortBy,
	]);
};
