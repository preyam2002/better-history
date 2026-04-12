import { useEffect, useRef } from "react";
import type { Visit } from "../../shared/types";
import {
	formatDuration,
	formatRelativeTime,
	getFaviconUrl,
} from "../../shared/utils";

interface VisitDetailPanelProps {
	visit: Visit | null;
	onClose: () => void;
}

export const VisitDetailPanel = ({ visit, onClose }: VisitDetailPanelProps) => {
	const panelRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		if (visit) {
			document.addEventListener("keydown", handleKeyDown);
			panelRef.current?.focus();
		}
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [visit, onClose]);

	return (
		<>
			{/* Backdrop */}
			<div
				className={`fixed inset-0 bg-sand-900/20 dark:bg-black/40 backdrop-blur-[2px] z-50 transition-opacity duration-200 ${
					visit ? "opacity-100" : "opacity-0 pointer-events-none"
				}`}
				onClick={onClose}
			/>

			{/* Panel */}
			<div
				ref={panelRef}
				tabIndex={-1}
				className={`fixed top-0 right-0 bottom-0 w-full sm:w-[440px] bg-white dark:bg-sand-900 border-l border-sand-200 dark:border-sand-800 z-50 overflow-y-auto shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] focus:outline-none ${
					visit ? "translate-x-0" : "translate-x-full"
				}`}
			>
				{visit && <PanelContent visit={visit} onClose={onClose} />}
			</div>
		</>
	);
};

const PanelContent = ({
	visit,
	onClose,
}: {
	visit: Visit;
	onClose: () => void;
}) => {
	const faviconUrl = getFaviconUrl(visit.favIconUrl, visit.domain);

	return (
		<div className="flex flex-col h-full">
			{/* Header */}
			<div className="flex items-center justify-between px-5 py-4 border-b border-sand-100 dark:border-sand-800 sticky top-0 bg-white dark:bg-sand-900 z-10">
				<h2 className="text-[13px] font-semibold text-sand-700 dark:text-sand-200 truncate pr-4">
					Page Details
				</h2>
				<button
					type="button"
					onClick={onClose}
					className="p-1.5 rounded-lg hover:bg-sand-100 dark:hover:bg-sand-800 text-sand-400 hover:text-sand-600 dark:hover:text-sand-300 transition-colors flex-shrink-0"
				>
					<svg
						className="w-4 h-4"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>

			<div className="flex-1 p-5 space-y-5">
				{/* Title + Favicon */}
				<div className="flex items-start gap-3">
					{faviconUrl ? (
						<img
							src={faviconUrl}
							alt={visit.domain}
							className="w-8 h-8 rounded-lg flex-shrink-0 mt-0.5"
						/>
					) : (
						<div className="w-8 h-8 rounded-lg flex-shrink-0 mt-0.5 bg-sand-200 dark:bg-sand-700 flex items-center justify-center text-sm font-bold text-sand-500 uppercase">
							{visit.domain.charAt(0)}
						</div>
					)}
					<div className="min-w-0">
						<h3 className="text-[15px] font-medium text-sand-800 dark:text-sand-200 leading-snug">
							{visit.title || "Untitled Page"}
						</h3>
						<a
							href={visit.url}
							target="_blank"
							rel="noopener noreferrer"
							className="text-[12px] text-honey-600 dark:text-honey-400 hover:underline truncate block mt-0.5"
						>
							{visit.url}
						</a>
					</div>
				</div>

				{/* Metadata grid */}
				<div className="grid grid-cols-2 gap-3">
					<MetaItem label="Domain" value={visit.domain} />
					<MetaItem
						label="Visited"
						value={formatRelativeTime(visit.timestamp)}
					/>
					<MetaItem
						label="Duration"
						value={visit.duration > 0 ? formatDuration(visit.duration) : "< 1s"}
					/>
					<MetaItem
						label="Scroll Depth"
						value={visit.scrollDepth > 0 ? `${visit.scrollDepth}%` : "—"}
					/>
					<MetaItem
						label="Date"
						value={new Date(visit.timestamp).toLocaleDateString("en-US", {
							weekday: "short",
							month: "short",
							day: "numeric",
							year: "numeric",
						})}
					/>
					<MetaItem
						label="Time"
						value={new Date(visit.timestamp).toLocaleTimeString("en-US", {
							hour: "2-digit",
							minute: "2-digit",
						})}
					/>
				</div>

				{/* Scroll depth bar */}
				{visit.scrollDepth > 0 && (
					<div>
						<div className="text-[10px] uppercase tracking-wider text-sand-400 mb-2 font-medium">
							Scroll Progress
						</div>
						<div className="h-2 bg-sand-100 dark:bg-sand-800 rounded-full overflow-hidden">
							<div
								className="h-full bg-moss-400 dark:bg-moss-500 rounded-full transition-all duration-500"
								style={{ width: `${visit.scrollDepth}%` }}
							/>
						</div>
						<div className="text-[10px] text-sand-400 mt-1 tabular-nums text-right">
							{visit.scrollDepth}% of page
						</div>
					</div>
				)}

				{/* Extracted content preview */}
				{visit.textContent && (
					<div>
						<div className="text-[10px] uppercase tracking-wider text-sand-400 mb-2 font-medium">
							Extracted Content
						</div>
						<div className="bg-sand-50 dark:bg-sand-850 border border-sand-100 dark:border-sand-800 rounded-lg p-3 max-h-64 overflow-y-auto">
							<p className="text-[12px] text-sand-600 dark:text-sand-400 leading-relaxed whitespace-pre-wrap break-words">
								{visit.textContent.slice(0, 2000)}
								{visit.textContent.length > 2000 && (
									<span className="text-sand-400 dark:text-sand-500">
										... ({(visit.textContent.length - 2000).toLocaleString()}{" "}
										more chars)
									</span>
								)}
							</p>
						</div>
					</div>
				)}
			</div>

			{/* Footer action */}
			<div className="sticky bottom-0 px-5 py-4 border-t border-sand-100 dark:border-sand-800 bg-white dark:bg-sand-900">
				<a
					href={visit.url}
					target="_blank"
					rel="noopener noreferrer"
					className="block w-full text-center px-4 py-2.5 bg-sand-800 dark:bg-sand-200 text-white dark:text-sand-900 rounded-lg hover:bg-sand-700 dark:hover:bg-sand-300 text-[13px] font-medium transition-colors"
				>
					Open Page
				</a>
			</div>
		</div>
	);
};

const MetaItem = ({ label, value }: { label: string; value: string }) => (
	<div className="p-2.5 bg-sand-50 dark:bg-sand-850 rounded-lg">
		<div className="text-[9px] uppercase tracking-wider text-sand-400 font-medium">
			{label}
		</div>
		<div className="text-[13px] text-sand-700 dark:text-sand-300 mt-0.5 truncate">
			{value}
		</div>
	</div>
);
