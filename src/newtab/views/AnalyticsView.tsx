import { useState } from "react";
import { useAnalytics } from "../hooks/useAnalytics";
import { formatDuration } from "../../shared/utils";
import { TopDomains } from "../components/analytics/TopDomains";
import { DailyUsage } from "../components/analytics/DailyUsage";
import { TimeHeatmap } from "../components/analytics/TimeHeatmap";
import { WeeklyTrend } from "../components/analytics/WeeklyTrend";

const ranges = [
	{ label: "Today", days: 1 },
	{ label: "This Week", days: 7 },
	{ label: "This Month", days: 30 },
	{ label: "Last 90 days", days: 90 },
] as const;

export const AnalyticsView = () => {
	const [selectedDays, setSelectedDays] = useState(7);
	const range = {
		start: Date.now() - selectedDays * 24 * 60 * 60 * 1000,
		end: Date.now(),
	};

	const data = useAnalytics(range);

	const avgPerDay =
		data && selectedDays > 1
			? Math.round(data.totalVisits / selectedDays)
			: null;

	return (
		<div className="space-y-8">
			<div className="flex items-baseline justify-between">
				<h2 className="font-serif italic text-lg text-sand-700 dark:text-sand-200">
					Browsing Insights
				</h2>
				<div className="flex gap-1">
					{ranges.map((r) => (
						<button
							key={r.days}
							onClick={() => setSelectedDays(r.days)}
							className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition-all duration-200 ${
								selectedDays === r.days
									? "bg-honey-100 text-honey-800 dark:bg-honey-900/30 dark:text-honey-300"
									: "text-sand-500 hover:text-sand-700 hover:bg-sand-100 dark:text-sand-400 dark:hover:bg-sand-800"
							}`}
						>
							{r.label}
						</button>
					))}
				</div>
			</div>

			{!data ? (
				<AnalyticsSkeleton />
			) : data.totalVisits === 0 ? (
				<div className="py-20 text-center">
					<div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-sand-100 dark:bg-sand-800 flex items-center justify-center">
						<svg className="w-6 h-6 text-sand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
						</svg>
					</div>
					<p className="font-serif text-xl italic text-sand-600 dark:text-sand-300">
						No data yet
					</p>
					<p className="text-[13px] text-sand-400 mt-1.5">
						Start browsing to see your analytics here.
					</p>
				</div>
			) : (
				<div className="stagger-children">
					<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
						<SummaryCard
							value={formatDuration(data.totalTime)}
							label="Total time"
							accent="honey"
						/>
						<SummaryCard
							value={data.totalVisits.toLocaleString()}
							label="Pages visited"
							accent="sand"
						/>
						<SummaryCard
							value={data.uniqueDomains.toString()}
							label="Unique sites"
							accent="sand"
						/>
						<SummaryCard
							value={avgPerDay !== null ? `${avgPerDay}/day` : data.totalVisits.toLocaleString()}
							label={avgPerDay !== null ? "Avg. pages" : "Pages today"}
							accent="sand"
						/>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
						<TopDomains data={data.topDomains} />
						<DailyUsage data={data.dailyUsage} />
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<TimeHeatmap data={data.heatmap} />
						<WeeklyTrend data={data.weeklyTrend} />
					</div>
				</div>
			)}
		</div>
	);
};

const SummaryCard = ({
	value,
	label,
	accent,
}: {
	value: string;
	label: string;
	accent: "honey" | "sand";
}) => (
	<div className={`bg-white dark:bg-sand-900/50 rounded-xl border p-4 transition-shadow hover:shadow-sm ${
		accent === "honey"
			? "border-honey-200 dark:border-honey-800/30"
			: "border-sand-200 dark:border-sand-800"
	}`}>
		<div className={`text-2xl font-bold tracking-tight tabular-nums ${
			accent === "honey"
				? "text-honey-700 dark:text-honey-400"
				: "text-sand-800 dark:text-sand-200"
		}`}>
			{value}
		</div>
		<div className="text-[10px] text-sand-400 mt-1 tracking-wide uppercase">{label}</div>
	</div>
);

const AnalyticsSkeleton = () => (
	<div className="space-y-6 animate-pulse">
		<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
			{Array.from({ length: 4 }).map((_, i) => (
				<div key={i} className="bg-white dark:bg-sand-900/50 rounded-xl border border-sand-200 dark:border-sand-800 p-4 h-20">
					<div className="h-6 bg-sand-200 dark:bg-sand-800 rounded w-16 mb-2" />
					<div className="h-3 bg-sand-100 dark:bg-sand-850 rounded w-20" />
				</div>
			))}
		</div>
		<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
			{Array.from({ length: 2 }).map((_, i) => (
				<div key={i} className="bg-white dark:bg-sand-900/50 rounded-xl border border-sand-200 dark:border-sand-800 p-4 h-64" />
			))}
		</div>
	</div>
);
