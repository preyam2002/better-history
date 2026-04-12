import type { Visit } from "../../shared/types";

export interface DomainStat {
	domain: string;
	totalDuration: number;
	visitCount: number;
}

export interface DailyStat {
	date: string;
	visits: number;
	duration: number;
}

export interface HeatmapCell {
	day: number; // 0-6 (Mon-Sun)
	hour: number; // 0-23
	count: number;
}

export interface WeeklyStat {
	week: string;
	duration: number;
	visits: number;
}

export const aggregateByDomain = (visits: Visit[]): DomainStat[] => {
	const map = new Map<string, DomainStat>();
	for (const v of visits) {
		const stat = map.get(v.domain) ?? {
			domain: v.domain,
			totalDuration: 0,
			visitCount: 0,
		};
		stat.totalDuration += v.duration;
		stat.visitCount++;
		map.set(v.domain, stat);
	}
	return [...map.values()].sort((a, b) => b.totalDuration - a.totalDuration);
};

export const aggregateByDay = (visits: Visit[]): DailyStat[] => {
	const map = new Map<string, DailyStat & { _ts: number }>();
	for (const v of visits) {
		const d = new Date(v.timestamp);
		// Use ISO date as key to prevent cross-year collisions (e.g. "Jan 1" in different years)
		const key = d.toISOString().slice(0, 10);
		const date = d.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
		});
		const stat = map.get(key) ?? {
			date,
			visits: 0,
			duration: 0,
			_ts: v.timestamp,
		};
		stat.visits++;
		stat.duration += v.duration;
		map.set(key, stat);
	}
	return [...map.values()]
		.sort((a, b) => a._ts - b._ts)
		.map(({ _ts: _, ...rest }) => rest);
};

export const aggregateByDayAndHour = (visits: Visit[]): HeatmapCell[] => {
	const grid = new Map<string, number>();
	for (const v of visits) {
		const d = new Date(v.timestamp);
		const day = (d.getDay() + 6) % 7; // Mon=0, Sun=6
		const hour = d.getHours();
		const key = `${day}-${hour}`;
		grid.set(key, (grid.get(key) ?? 0) + 1);
	}
	const cells: HeatmapCell[] = [];
	for (let day = 0; day < 7; day++) {
		for (let hour = 0; hour < 24; hour++) {
			cells.push({ day, hour, count: grid.get(`${day}-${hour}`) ?? 0 });
		}
	}
	return cells;
};

export const aggregateByWeek = (visits: Visit[]): WeeklyStat[] => {
	const map = new Map<string, WeeklyStat & { _ts: number }>();
	for (const v of visits) {
		const d = new Date(v.timestamp);
		const startOfWeek = new Date(d);
		startOfWeek.setDate(d.getDate() - d.getDay());
		// Use ISO date as key to prevent cross-year collisions
		const key = startOfWeek.toISOString().slice(0, 10);
		const week = startOfWeek.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
		});
		const existing = map.get(key);
		const stat = existing ?? {
			week,
			duration: 0,
			visits: 0,
			_ts: startOfWeek.getTime(),
		};
		stat.duration += v.duration;
		stat.visits++;
		map.set(key, stat);
	}
	return [...map.values()]
		.sort((a, b) => a._ts - b._ts)
		.map(({ _ts: _, ...rest }) => rest);
};
