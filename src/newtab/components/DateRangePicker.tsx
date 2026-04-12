import { useState } from "react";

interface DateRangePickerProps {
	value: { start: number; end: number } | null;
	onChange: (range: { start: number; end: number } | null) => void;
}

const presets = [
	{ label: "All time", value: null as null },
	{ label: "Today", days: 1 },
	{ label: "Yesterday", days: 2, offset: 1 },
	{ label: "Last 7 days", days: 7 },
	{ label: "Last 30 days", days: 30 },
	{ label: "Last 90 days", days: 90 },
] as const;

const getRange = (
	preset: (typeof presets)[number],
): { start: number; end: number } | null => {
	if (!("days" in preset)) return null;
	const now = Date.now();
	const end =
		"offset" in preset && preset.offset
			? now - preset.offset * 24 * 60 * 60 * 1000
			: now;
	const start = end - preset.days * 24 * 60 * 60 * 1000;
	return { start, end };
};

const toDateStr = (ts: number): string =>
	new Date(ts).toISOString().slice(0, 10);

const fromDateStr = (str: string, endOfDay = false): number => {
	const d = new Date(str);
	if (endOfDay) d.setHours(23, 59, 59, 999);
	return d.getTime();
};

export const DateRangePicker = ({ value, onChange }: DateRangePickerProps) => {
	const [showCustom, setShowCustom] = useState(false);

	const isCustom =
		value !== null &&
		!presets.some((preset) => {
			const range = getRange(preset);
			return range !== null && Math.abs(value.start - range.start) < 60000;
		});

	return (
		<div className="flex flex-wrap items-center gap-1">
			{presets.map((preset) => {
				const range = getRange(preset);
				const isActive =
					value === null
						? range === null
						: range !== null && Math.abs(value.start - range.start) < 60000;
				return (
					<button
						type="button"
						key={preset.label}
						onClick={() => {
							onChange(range);
							setShowCustom(false);
						}}
						className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all duration-200 ${
							isActive
								? "bg-honey-100 text-honey-800 dark:bg-honey-900/30 dark:text-honey-300"
								: "text-sand-500 hover:text-sand-700 hover:bg-sand-100 dark:text-sand-400 dark:hover:bg-sand-800"
						}`}
					>
						{preset.label}
					</button>
				);
			})}
			<button
				type="button"
				onClick={() => setShowCustom(!showCustom)}
				className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all duration-200 ${
					showCustom || isCustom
						? "bg-honey-100 text-honey-800 dark:bg-honey-900/30 dark:text-honey-300"
						: "text-sand-500 hover:text-sand-700 hover:bg-sand-100 dark:text-sand-400 dark:hover:bg-sand-800"
				}`}
			>
				Custom
			</button>
			{showCustom && (
				<div className="flex items-center gap-2 basis-full mt-2">
					<input
						type="date"
						defaultValue={value ? toDateStr(value.start) : ""}
						max={toDateStr(Date.now())}
						onChange={(e) => {
							if (!e.target.value) return;
							const start = fromDateStr(e.target.value);
							const end = value?.end ?? Date.now();
							onChange({ start, end: Math.max(start, end) });
						}}
						className="px-2.5 py-1.5 text-[11px] bg-white dark:bg-sand-850 border border-sand-200 dark:border-sand-700 rounded-md focus:outline-none focus:border-honey-300 dark:focus:border-honey-700 text-sand-700 dark:text-sand-300"
					/>
					<span className="text-[11px] text-sand-400">to</span>
					<input
						type="date"
						defaultValue={value ? toDateStr(value.end) : toDateStr(Date.now())}
						max={toDateStr(Date.now())}
						onChange={(e) => {
							if (!e.target.value) return;
							const end = fromDateStr(e.target.value, true);
							const start = value?.start ?? end - 7 * 24 * 60 * 60 * 1000;
							onChange({ start: Math.min(start, end), end });
						}}
						className="px-2.5 py-1.5 text-[11px] bg-white dark:bg-sand-850 border border-sand-200 dark:border-sand-700 rounded-md focus:outline-none focus:border-honey-300 dark:focus:border-honey-700 text-sand-700 dark:text-sand-300"
					/>
				</div>
			)}
		</div>
	);
};
