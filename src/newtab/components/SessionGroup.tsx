import { useState, useRef, useEffect, useMemo } from "react";
import type { SessionWithVisits } from "../hooks/useSessions";
import { formatTime, formatDuration, getFaviconUrl } from "../../shared/utils";
import { VisitCard } from "./VisitCard";

interface SessionGroupProps {
	session: SessionWithVisits;
}

export const SessionGroup = ({ session }: SessionGroupProps) => {
	const [expanded, setExpanded] = useState(false);
	const contentRef = useRef<HTMLDivElement>(null);
	const [contentHeight, setContentHeight] = useState(0);

	useEffect(() => {
		if (expanded && contentRef.current) {
			setContentHeight(contentRef.current.scrollHeight);
		}
	}, [expanded, session.visits.length]);

	const totalDuration = session.visits.reduce((sum, v) => sum + v.duration, 0);
	const uniqueDomains = [...new Set(session.visits.map((v) => v.domain))];

	const topFavicons = useMemo(() => {
		const seen = new Set<string>();
		const icons: { url: string | null; domain: string }[] = [];
		for (const v of session.visits) {
			if (!seen.has(v.domain)) {
				seen.add(v.domain);
				icons.push({ url: getFaviconUrl(v.favIconUrl, v.domain), domain: v.domain });
				if (icons.length >= 4) break;
			}
		}
		return icons;
	}, [session.visits]);

	return (
		<div className={`border rounded-xl overflow-hidden transition-all duration-200 ${
			expanded
				? "border-honey-200 dark:border-honey-800/40 shadow-sm shadow-honey-100/50 dark:shadow-none"
				: "border-sand-200 dark:border-sand-800 hover:border-sand-300 dark:hover:border-sand-700"
		}`}>
			<button
				onClick={() => setExpanded(!expanded)}
				className={`w-full flex items-center justify-between gap-3 px-4 py-3.5 transition-colors text-left ${
					expanded
						? "bg-honey-50/50 dark:bg-honey-900/5"
						: "hover:bg-sand-50 dark:hover:bg-sand-850"
				}`}
				aria-expanded={expanded}
			>
				<div className="flex items-center gap-3 min-w-0">
					<svg
						className={`w-3 h-3 text-sand-400 transition-transform duration-200 flex-shrink-0 ${expanded ? "rotate-90" : ""}`}
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
					</svg>

					<div className="flex -space-x-1.5 flex-shrink-0">
						{topFavicons.map((icon, i) =>
							icon.url ? (
								<img
									key={i}
									src={icon.url}
									alt={icon.domain}
									className="w-4 h-4 rounded ring-2 ring-white dark:ring-sand-900"
									loading="lazy"
								/>
							) : (
								<div
									key={i}
									className="w-4 h-4 rounded ring-2 ring-white dark:ring-sand-900 bg-sand-200 dark:bg-sand-700 flex items-center justify-center text-[7px] font-bold text-sand-500 uppercase"
								>
									{icon.domain.charAt(0)}
								</div>
							),
						)}
					</div>

					<div className="min-w-0">
						<div className="text-[13px] font-medium text-sand-700 dark:text-sand-200 tabular-nums">
							{formatTime(session.startTime)}
							<span className="text-sand-300 dark:text-sand-600 mx-1">–</span>
							{formatTime(session.endTime)}
						</div>
						<div className="text-[11px] text-sand-400 truncate mt-0.5">
							{uniqueDomains.slice(0, 3).join(", ")}
							{uniqueDomains.length > 3 &&
								` +${uniqueDomains.length - 3} more`}
						</div>
					</div>
				</div>
				<div className="flex items-center gap-2 flex-shrink-0">
					<span className="text-[11px] text-sand-400 tabular-nums">
						{session.visitCount} page{session.visitCount !== 1 ? "s" : ""}
					</span>
					{totalDuration > 0 && (
						<span className="text-[10px] font-medium tabular-nums px-2 py-0.5 bg-honey-50 dark:bg-honey-900/20 text-honey-700 dark:text-honey-400 rounded-md">
							{formatDuration(totalDuration)}
						</span>
					)}
				</div>
			</button>
			<div
				className="overflow-hidden transition-all duration-300 ease-in-out"
				style={{ maxHeight: expanded ? `${contentHeight}px` : "0px" }}
			>
				<div
					ref={contentRef}
					className="border-t border-sand-100 dark:border-sand-800 px-2 py-1 bg-sand-50/50 dark:bg-sand-950/30"
				>
					{session.visits.map((visit) => (
						<VisitCard key={visit.id} visit={visit} />
					))}
				</div>
			</div>
		</div>
	);
};
