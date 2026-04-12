import { Fragment } from "react";
import type { HeatmapCell } from "../../lib/analytics";

interface TimeHeatmapProps {
	data: HeatmapCell[];
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const getColor = (count: number, max: number): string => {
	if (count === 0) return "bg-sand-100 dark:bg-sand-800/50";
	const ratio = count / max;
	if (ratio > 0.75) return "bg-honey-500 dark:bg-honey-500";
	if (ratio > 0.5) return "bg-honey-400 dark:bg-honey-600";
	if (ratio > 0.25) return "bg-honey-300 dark:bg-honey-700";
	return "bg-honey-200 dark:bg-honey-800";
};

export const TimeHeatmap = ({ data }: TimeHeatmapProps) => {
	const max = Math.max(...data.map((c) => c.count), 1);

	return (
		<div className="bg-white dark:bg-sand-900/50 rounded-xl border border-sand-200 dark:border-sand-800 p-4">
			<h3 className="text-[12px] font-semibold text-sand-500 dark:text-sand-400 uppercase tracking-wider mb-4">
				Activity Heatmap
			</h3>
			<div className="overflow-x-auto">
				<div
					className="grid gap-[3px]"
					style={{ gridTemplateColumns: "36px repeat(24, 1fr)" }}
				>
					<div />
					{HOURS.map((h) => (
						<div
							key={`h-${h}`}
							className="text-[8px] text-sand-400 text-center"
						>
							{h % 6 === 0 ? `${h}:00` : ""}
						</div>
					))}

					{DAYS.map((day, dayIdx) => (
						<Fragment key={day}>
							<div className="text-[10px] text-sand-400 flex items-center">
								{day}
							</div>
							{HOURS.map((hour) => {
								const cell = data.find(
									(c) => c.day === dayIdx && c.hour === hour,
								);
								const count = cell?.count ?? 0;
								return (
									<div
										key={`${dayIdx}-${hour}`}
										className={`aspect-square rounded-[3px] transition-colors ${getColor(count, max)}`}
										title={`${day} ${hour}:00 — ${count} visits`}
									/>
								);
							})}
						</Fragment>
					))}
				</div>

				<div className="flex items-center justify-end gap-1.5 mt-3">
					<span className="text-[9px] text-sand-400">Less</span>
					<div className="w-2.5 h-2.5 rounded-sm bg-sand-100 dark:bg-sand-800/50" />
					<div className="w-2.5 h-2.5 rounded-sm bg-honey-200 dark:bg-honey-800" />
					<div className="w-2.5 h-2.5 rounded-sm bg-honey-300 dark:bg-honey-700" />
					<div className="w-2.5 h-2.5 rounded-sm bg-honey-400 dark:bg-honey-600" />
					<div className="w-2.5 h-2.5 rounded-sm bg-honey-500 dark:bg-honey-500" />
					<span className="text-[9px] text-sand-400">More</span>
				</div>
			</div>
		</div>
	);
};
