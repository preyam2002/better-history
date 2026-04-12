import {
	Bar,
	BarChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { formatDuration } from "../../../shared/utils";
import type { DomainStat } from "../../lib/analytics";

interface TopDomainsProps {
	data: DomainStat[];
}

export const TopDomains = ({ data }: TopDomainsProps) => {
	if (data.length === 0) return null;

	const chartData = data.map((d) => ({
		domain: d.domain.length > 20 ? `${d.domain.slice(0, 18)}...` : d.domain,
		minutes: Math.round(d.totalDuration / 60),
		visits: d.visitCount,
		label: formatDuration(d.totalDuration),
	}));

	return (
		<div className="bg-white dark:bg-sand-900/50 rounded-xl border border-sand-200 dark:border-sand-800 p-4">
			<h3 className="text-[12px] font-semibold text-sand-500 dark:text-sand-400 uppercase tracking-wider mb-4">
				Top Domains
			</h3>
			<ResponsiveContainer width="100%" height={280}>
				<BarChart data={chartData} layout="vertical" margin={{ left: 80 }}>
					<XAxis type="number" hide />
					<YAxis
						type="category"
						dataKey="domain"
						tick={{ fontSize: 11, fill: "#9C9889" }}
						width={80}
					/>
					<Tooltip
						contentStyle={{
							background: "#222220",
							border: "1px solid #33322C",
							borderRadius: 10,
							fontSize: 12,
							color: "#E8E6DF",
						}}
						formatter={(value: number) => [`${value} min`, "Time"]}
					/>
					<Bar
						dataKey="minutes"
						fill="#C49028"
						radius={[0, 4, 4, 0]}
						barSize={16}
					/>
				</BarChart>
			</ResponsiveContainer>
		</div>
	);
};
