import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	Tooltip,
	ResponsiveContainer,
} from "recharts";
import type { WeeklyStat } from "../../lib/analytics";

interface WeeklyTrendProps {
	data: WeeklyStat[];
}

export const WeeklyTrend = ({ data }: WeeklyTrendProps) => {
	if (data.length === 0) return null;

	const chartData = data.map((d) => ({
		week: d.week,
		hours: Math.round(d.duration / 3600),
		visits: d.visits,
	}));

	return (
		<div className="bg-white dark:bg-sand-900/50 rounded-xl border border-sand-200 dark:border-sand-800 p-4">
			<h3 className="text-[12px] font-semibold text-sand-500 dark:text-sand-400 uppercase tracking-wider mb-4">
				Weekly Trend
			</h3>
			<ResponsiveContainer width="100%" height={200}>
				<LineChart data={chartData}>
					<XAxis
						dataKey="week"
						tick={{ fontSize: 10, fill: "#9C9889" }}
					/>
					<YAxis hide />
					<Tooltip
						contentStyle={{
							background: "#222220",
							border: "1px solid #33322C",
							borderRadius: 10,
							fontSize: 12,
							color: "#E8E6DF",
						}}
						formatter={(value: number, name: string) => [
							value,
							name === "hours" ? "Hours" : "Pages",
						]}
					/>
					<Line
						type="monotone"
						dataKey="hours"
						stroke="#C49028"
						strokeWidth={2}
						dot={{ r: 3, fill: "#C49028", strokeWidth: 0 }}
						activeDot={{ r: 5, fill: "#C49028", strokeWidth: 2, stroke: "#FDF8ED" }}
					/>
				</LineChart>
			</ResponsiveContainer>
		</div>
	);
};
