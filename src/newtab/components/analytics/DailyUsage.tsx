import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	Tooltip,
	ResponsiveContainer,
} from "recharts";
import type { DailyStat } from "../../lib/analytics";

interface DailyUsageProps {
	data: DailyStat[];
}

export const DailyUsage = ({ data }: DailyUsageProps) => {
	if (data.length === 0) return null;

	return (
		<div className="bg-white dark:bg-sand-900/50 rounded-xl border border-sand-200 dark:border-sand-800 p-4">
			<h3 className="text-[12px] font-semibold text-sand-500 dark:text-sand-400 uppercase tracking-wider mb-4">
				Daily Activity
			</h3>
			<ResponsiveContainer width="100%" height={200}>
				<BarChart data={data}>
					<XAxis
						dataKey="date"
						tick={{ fontSize: 10, fill: "#9C9889" }}
						interval="preserveStartEnd"
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
						formatter={(value: number) => [value, "Pages"]}
					/>
					<Bar dataKey="visits" fill="#D4A53C" radius={[3, 3, 0, 0]} />
				</BarChart>
			</ResponsiveContainer>
		</div>
	);
};
