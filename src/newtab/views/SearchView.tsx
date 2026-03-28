import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import type { SearchFilters, Visit } from "../../shared/types";
import { db } from "../../shared/db";
import { formatDate } from "../../shared/utils";
import { useSearch } from "../hooks/useSearch";
import { SearchBar } from "../components/SearchBar";
import { DomainChip } from "../components/DomainChip";
import { DateRangePicker } from "../components/DateRangePicker";
import { VisitCard } from "../components/VisitCard";
import { EmptyState } from "../components/EmptyState";
import { VisitDetailPanel } from "../components/VisitDetailPanel";
import { useToast } from "../components/Toast";

export const SearchView = () => {
	const [filters, setFilters] = useState<SearchFilters>({
		query: "",
		domains: [],
		dateRange: null,
		minDuration: null,
		sortBy: "recent",
	});

	const results = useSearch(filters);
	const [selectedIndex, setSelectedIndex] = useState(-1);
	const [detailVisit, setDetailVisit] = useState<Visit | null>(null);
	const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
	const [selectionMode, setSelectionMode] = useState(false);
	const listRef = useRef<HTMLDivElement>(null);

	const flatResults = useMemo(
		() => (results ? results : []),
		[results],
	);

	// Reset selection when results change
	useEffect(() => {
		setSelectedIndex(-1);
	}, [results]);

	// Keyboard navigation
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			const target = e.target as HTMLElement;
			const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA";

			if (detailVisit) return; // Let panel handle its own keys

			if (e.key === "ArrowDown" || (e.key === "j" && !isInput)) {
				e.preventDefault();
				setSelectedIndex((i) => Math.min(i + 1, flatResults.length - 1));
			} else if (e.key === "ArrowUp" || (e.key === "k" && !isInput)) {
				e.preventDefault();
				setSelectedIndex((i) => Math.max(i - 1, -1));
			} else if (e.key === "Enter" && !isInput && selectedIndex >= 0) {
				e.preventDefault();
				const visit = flatResults[selectedIndex];
				if (visit) setDetailVisit(visit);
			} else if ((e.key === "o" || e.key === "O") && !isInput && selectedIndex >= 0) {
				const visit = flatResults[selectedIndex];
				if (visit) window.open(visit.url, "_blank");
			}
		};
		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [flatResults, selectedIndex, detailVisit]);

	// Scroll selected into view
	useEffect(() => {
		if (selectedIndex < 0 || !listRef.current) return;
		const el = listRef.current.querySelector(`[data-visit-id="${flatResults[selectedIndex]?.id}"]`);
		el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
	}, [selectedIndex, flatResults]);

	const { toast } = useToast();

	const toggleSelect = useCallback((visit: Visit) => {
		if (!visit.id) return;
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(visit.id!)) next.delete(visit.id!);
			else next.add(visit.id!);
			return next;
		});
	}, []);

	const selectAll = useCallback(() => {
		if (!results) return;
		setSelectedIds(new Set(results.map((v) => v.id!).filter(Boolean)));
	}, [results]);

	const clearSelection = useCallback(() => {
		setSelectedIds(new Set());
		setSelectionMode(false);
	}, []);

	const bulkDelete = useCallback(async () => {
		if (selectedIds.size === 0) return;
		await db.visits.bulkDelete([...selectedIds]);
		toast(`${selectedIds.size} visit${selectedIds.size > 1 ? "s" : ""} removed`, "info");
		clearSelection();
	}, [selectedIds, toast, clearSelection]);

	const bulkExport = useCallback(async () => {
		if (selectedIds.size === 0) return;
		const visits = await db.visits.where("id").anyOf([...selectedIds]).toArray();
		const blob = new Blob(
			[JSON.stringify({ visits, exportedAt: Date.now() }, null, 2)],
			{ type: "application/json" },
		);
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `better-history-selection-${new Date().toISOString().slice(0, 10)}.json`;
		a.click();
		URL.revokeObjectURL(url);
		toast(`Exported ${selectedIds.size} visit${selectedIds.size > 1 ? "s" : ""}`);
	}, [selectedIds, toast]);

	const totalCount = useLiveQuery(() => db.visits.count());

	const topDomains = useLiveQuery(async () => {
		const now = Date.now();
		const start = filters.dateRange?.start ?? now - 30 * 24 * 60 * 60 * 1000;
		const end = filters.dateRange?.end ?? now;

		const visits = await db.visits
			.where("timestamp")
			.between(start, end, true, true)
			.toArray();

		const counts = new Map<string, number>();
		for (const v of visits) {
			counts.set(v.domain, (counts.get(v.domain) ?? 0) + 1);
		}
		return [...counts.entries()]
			.sort((a, b) => b[1] - a[1])
			.slice(0, 8)
			.map(([domain]) => domain);
	}, [filters.dateRange?.start, filters.dateRange?.end]);

	const setQuery = useCallback(
		(query: string) => setFilters((f) => ({ ...f, query })),
		[],
	);

	const toggleDomain = useCallback((domain: string) => {
		setFilters((f) => ({
			...f,
			domains: f.domains.includes(domain)
				? f.domains.filter((d) => d !== domain)
				: [...f.domains, domain],
		}));
	}, []);

	const setDateRange = useCallback(
		(dateRange: { start: number; end: number } | null) =>
			setFilters((f) => ({ ...f, dateRange })),
		[],
	);

	const activeFilterCount =
		(filters.domains.length > 0 ? 1 : 0) +
		(filters.dateRange !== null ? 1 : 0) +
		(filters.query ? 1 : 0) +
		(filters.minDuration ? 1 : 0);

	const clearAllFilters = useCallback(() => {
		setFilters({
			query: "",
			domains: [],
			dateRange: null,
			minDuration: null,
			sortBy: "recent",
		});
	}, []);

	const grouped = useMemo(() => {
		if (!results) return [];
		const groups = new Map<string, typeof results>();
		for (const visit of results) {
			const key = new Date(visit.timestamp).toDateString();
			const group = groups.get(key);
			if (group) group.push(visit);
			else groups.set(key, [visit]);
		}
		return [...groups.entries()].map(([dateStr, visits]) => ({
			date: new Date(dateStr).getTime(),
			visits,
		}));
	}, [results]);

	if (totalCount === 0 && results && results.length === 0) {
		return (
			<div className="space-y-5">
				<SearchBar value={filters.query} onChange={setQuery} />
				<EmptyState />
			</div>
		);
	}

	return (
		<div className="space-y-5">
			<SearchBar value={filters.query} onChange={setQuery} />

			<VisitDetailPanel visit={detailVisit} onClose={() => setDetailVisit(null)} />

			{/* Filters row */}
			<div className="flex flex-wrap items-center gap-3">
				<DateRangePicker value={filters.dateRange} onChange={setDateRange} />
				<div className="w-px h-5 bg-sand-200 dark:bg-sand-800 hidden sm:block" />
				<select
					value={filters.sortBy}
					onChange={(e) =>
						setFilters((f) => ({
							...f,
							sortBy: e.target.value as SearchFilters["sortBy"],
						}))
					}
					aria-label="Sort order"
					className="text-[11px] px-2.5 py-1.5 rounded-md bg-white dark:bg-sand-850 border border-sand-200 dark:border-sand-700 text-sand-600 dark:text-sand-400 cursor-pointer"
				>
					<option value="recent">Most recent</option>
					<option value="duration">Longest visit</option>
				</select>
				<select
					value={filters.minDuration ?? 0}
					onChange={(e) =>
						setFilters((f) => ({
							...f,
							minDuration: Number(e.target.value) || null,
						}))
					}
					aria-label="Minimum duration"
					className="text-[11px] px-2.5 py-1.5 rounded-md bg-white dark:bg-sand-850 border border-sand-200 dark:border-sand-700 text-sand-600 dark:text-sand-400 cursor-pointer"
				>
					<option value={0}>Any duration</option>
					<option value={10}>10s+</option>
					<option value={30}>30s+</option>
					<option value={60}>1min+</option>
					<option value={300}>5min+</option>
					<option value={600}>10min+</option>
				</select>
				{activeFilterCount > 0 && (
					<button
						onClick={clearAllFilters}
						className="text-[11px] text-honey-600 dark:text-honey-400 hover:text-honey-800 dark:hover:text-honey-300 font-medium transition-colors"
					>
						Clear filters ({activeFilterCount})
					</button>
				)}
			</div>

			{/* Domain chips */}
			{topDomains && topDomains.length > 0 && (
				<div className="flex flex-wrap gap-1.5">
					{topDomains.map((domain) => (
						<DomainChip
							key={domain}
							domain={domain}
							active={filters.domains.includes(domain)}
							onClick={() => toggleDomain(domain)}
							onRemove={() => toggleDomain(domain)}
						/>
					))}
				</div>
			)}

			{/* Results */}
			{!results ? (
				<LoadingSkeleton />
			) : results.length === 0 ? (
				<div className="py-20 text-center">
					<div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-sand-100 dark:bg-sand-800 flex items-center justify-center">
						<svg className="w-6 h-6 text-sand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
						</svg>
					</div>
					<p className="text-sand-600 dark:text-sand-300 text-[14px] font-medium">
						No results found
					</p>
					<p className="text-sand-400 text-[13px] mt-1.5 max-w-xs mx-auto leading-relaxed">
						{filters.query
							? `Nothing matched "${filters.query}". Try different keywords or broaden your filters.`
							: "No history matches the current filters."}
					</p>
					{activeFilterCount > 0 && (
						<button
							onClick={clearAllFilters}
							className="mt-5 text-[12px] text-honey-600 dark:text-honey-400 hover:text-honey-800 font-medium transition-colors"
						>
							Clear all filters
						</button>
					)}
				</div>
			) : (
				<div className="space-y-8" ref={listRef}>
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<p className="text-[11px] text-sand-400 tracking-wide">
								{results.length.toLocaleString()} result
								{results.length !== 1 ? "s" : ""}
								{filters.query && (
									<>
										{" for "}
										<span className="text-sand-600 dark:text-sand-300 font-medium">
											"{filters.query}"
										</span>
									</>
								)}
							</p>
							<button
								onClick={() => {
									setSelectionMode((m) => !m);
									if (selectionMode) clearSelection();
								}}
								className="text-[10px] text-sand-400 hover:text-sand-600 dark:hover:text-sand-300 transition-colors"
							>
								{selectionMode ? "Cancel" : "Select"}
							</button>
						</div>
						{selectedIndex >= 0 && !selectionMode && (
							<p className="text-[10px] text-sand-400 tabular-nums">
								{selectedIndex + 1} / {flatResults.length}
							</p>
						)}
					</div>

					{/* Bulk actions bar */}
					{selectionMode && (
						<div className="flex items-center gap-2 px-3 py-2.5 bg-sand-100 dark:bg-sand-850 rounded-lg animate-in">
							<button
								onClick={selectedIds.size === flatResults.length ? clearSelection : selectAll}
								className="text-[11px] text-honey-600 dark:text-honey-400 hover:text-honey-800 font-medium transition-colors"
							>
								{selectedIds.size === flatResults.length ? "Deselect all" : "Select all"}
							</button>
							<div className="w-px h-4 bg-sand-200 dark:bg-sand-700" />
							<span className="text-[11px] text-sand-500 tabular-nums">
								{selectedIds.size} selected
							</span>
							<div className="flex-1" />
							{selectedIds.size > 0 && (
								<>
									<button
										onClick={bulkExport}
										className="text-[11px] px-2.5 py-1 bg-sand-200 dark:bg-sand-800 text-sand-600 dark:text-sand-300 rounded-md hover:bg-sand-300 dark:hover:bg-sand-700 transition-colors font-medium"
									>
										Export
									</button>
									<button
										onClick={bulkDelete}
										className="text-[11px] px-2.5 py-1 bg-coral-50 dark:bg-coral-500/10 text-coral-500 rounded-md hover:bg-coral-100 dark:hover:bg-coral-500/20 transition-colors font-medium"
									>
										Delete
									</button>
								</>
							)}
						</div>
					)}
					{grouped.map(({ date, visits }) => (
						<div key={date}>
							<h2 className="font-serif italic text-[15px] text-sand-500 dark:text-sand-400 mb-3 sticky top-0 bg-sand-50/90 dark:bg-sand-950/90 backdrop-blur-sm py-2 z-10">
								{formatDate(date)}
							</h2>
							<div className="space-y-0.5">
								{visits.map((visit) => (
									<VisitCard
										key={visit.id}
										visit={visit}
										query={filters.query}
										selected={!selectionMode && flatResults[selectedIndex]?.id === visit.id}
										onSelect={selectionMode ? undefined : setDetailVisit}
										checked={selectionMode ? selectedIds.has(visit.id!) : undefined}
										onCheck={selectionMode ? toggleSelect : undefined}
									/>
								))}
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
};

const LoadingSkeleton = () => (
	<div className="space-y-5 animate-pulse">
		{Array.from({ length: 6 }).map((_, i) => (
			<div key={i} className="flex gap-3 px-3 py-2.5">
				<div className="w-5 h-5 rounded bg-sand-200 dark:bg-sand-800 flex-shrink-0" />
				<div className="flex-1 space-y-2">
					<div className="h-3.5 bg-sand-200 dark:bg-sand-800 rounded w-3/4" />
					<div className="h-2.5 bg-sand-100 dark:bg-sand-850 rounded w-1/2" />
				</div>
			</div>
		))}
	</div>
);
