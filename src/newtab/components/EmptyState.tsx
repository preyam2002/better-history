import { useImportHistory } from "../hooks/useImportHistory";

export const EmptyState = () => {
	const importState = useImportHistory();

	if (importState.importing && !importState.done) {
		const pct =
			importState.total > 0
				? Math.round((importState.current / importState.total) * 100)
				: 0;

		return (
			<div className="py-20 text-center">
				<div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-honey-50 dark:bg-honey-900/20 flex items-center justify-center">
					<svg
						className="w-6 h-6 text-honey-500 animate-spin"
						fill="none"
						viewBox="0 0 24 24"
					>
						<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
						<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
					</svg>
				</div>
				<h2 className="font-serif text-xl italic text-sand-800 dark:text-sand-200 mb-1.5">
					Importing your history...
				</h2>
				<p className="text-[13px] text-sand-500 mb-5 tabular-nums">
					{importState.current.toLocaleString()} of{" "}
					{importState.total.toLocaleString()} pages
				</p>
				<div className="w-56 mx-auto bg-sand-200 dark:bg-sand-800 rounded-full h-1.5 overflow-hidden">
					<div
						className="bg-honey-400 h-full rounded-full transition-all duration-500 ease-out"
						style={{ width: `${pct}%` }}
					/>
				</div>
			</div>
		);
	}

	return (
		<div className="py-20 text-center">
			<div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-sand-100 dark:bg-sand-800 flex items-center justify-center">
				<svg
					className="w-6 h-6 text-sand-400"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={1.5}
						d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
			</div>
			<h2 className="font-serif text-xl italic text-sand-800 dark:text-sand-200 mb-1.5">
				No history yet
			</h2>
			<p className="text-[13px] text-sand-500 max-w-xs mx-auto leading-relaxed">
				Your browsing history will appear here as you browse. Pages are
				automatically tracked with full-text content for powerful search.
			</p>
		</div>
	);
};
