import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useSessions } from "../hooks/useSessions";
import { SessionGroup } from "../components/SessionGroup";
import { formatDate, formatDuration } from "../../shared/utils";

export const TimelineView = () => {
	const [days, setDays] = useState(7);
	const sessions = useSessions(days);
	const sentinelRef = useRef<HTMLDivElement>(null);

	const loadMore = useCallback(() => setDays((d) => d + 7), []);

	useEffect(() => {
		const sentinel = sentinelRef.current;
		if (!sentinel) return;
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0]?.isIntersecting) loadMore();
			},
			{ rootMargin: "200px" },
		);
		observer.observe(sentinel);
		return () => observer.disconnect();
	}, [loadMore]);

	const grouped = useMemo(() => {
		if (!sessions) return [];
		const groups = new Map<string, typeof sessions>();
		for (const session of sessions) {
			const key = new Date(session.startTime).toDateString();
			const group = groups.get(key);
			if (group) group.push(session);
			else groups.set(key, [session]);
		}
		return [...groups.entries()].map(([dateStr, daySessions]) => {
			const totalDuration = daySessions.reduce(
				(sum, s) => sum + s.visits.reduce((vs, v) => vs + v.duration, 0),
				0,
			);
			const totalPages = daySessions.reduce(
				(sum, s) => sum + s.visits.length,
				0,
			);
			return {
				date: new Date(dateStr).getTime(),
				sessions: daySessions,
				totalDuration,
				totalPages,
			};
		});
	}, [sessions]);

	return (
		<div className="space-y-8">
			{!sessions ? (
				<TimelineSkeleton />
			) : sessions.length === 0 ? (
				<div className="py-20 text-center">
					<div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-sand-100 dark:bg-sand-800 flex items-center justify-center">
						<svg className="w-6 h-6 text-sand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
					</div>
					<p className="font-serif text-xl italic text-sand-600 dark:text-sand-300">
						No sessions yet
					</p>
					<p className="text-[13px] text-sand-400 mt-1.5">
						Your browsing sessions will appear here as you browse
					</p>
				</div>
			) : (
				<>
					{grouped.map(({ date, sessions: daySessions, totalDuration, totalPages }) => (
						<div key={date}>
							<div className="flex items-baseline justify-between mb-3 sticky top-0 bg-sand-50/90 dark:bg-sand-950/90 backdrop-blur-sm py-2 z-10">
								<div className="flex items-baseline gap-3">
									<h2 className="font-serif italic text-lg text-sand-700 dark:text-sand-200">
										{formatDate(date)}
									</h2>
									<span className="text-[11px] text-sand-400 tabular-nums">
										{daySessions.length} session{daySessions.length !== 1 ? "s" : ""}
									</span>
								</div>
								<div className="text-[11px] text-sand-400 flex gap-3 tabular-nums">
									<span>{totalPages} pages</span>
									{totalDuration > 0 && (
										<span className="text-honey-600 dark:text-honey-400 font-medium">
											{formatDuration(totalDuration)}
										</span>
									)}
								</div>
							</div>
							<div className="space-y-2">
								{daySessions.map((session) => (
									<SessionGroup key={session.id} session={session} />
								))}
							</div>
						</div>
					))}

					<div ref={sentinelRef} className="text-center py-6">
						<button
							onClick={loadMore}
							className="text-[12px] text-honey-600 hover:text-honey-700 dark:text-honey-400 dark:hover:text-honey-300 font-medium transition-colors"
						>
							Load earlier...
						</button>
					</div>
				</>
			)}
		</div>
	);
};

const TimelineSkeleton = () => (
	<div className="space-y-8 animate-pulse">
		{Array.from({ length: 3 }).map((_, i) => (
			<div key={i}>
				<div className="h-5 bg-sand-200 dark:bg-sand-800 rounded w-28 mb-3" />
				{Array.from({ length: 2 }).map((_, j) => (
					<div
						key={j}
						className="border border-sand-200 dark:border-sand-800 rounded-xl p-4 mb-2"
					>
						<div className="flex justify-between">
							<div className="h-3.5 bg-sand-200 dark:bg-sand-800 rounded w-36" />
							<div className="h-3.5 bg-sand-100 dark:bg-sand-850 rounded w-16" />
						</div>
						<div className="h-2.5 bg-sand-100 dark:bg-sand-850 rounded w-24 mt-2.5" />
					</div>
				))}
			</div>
		))}
	</div>
);
