import { db, refreshSession } from "../../shared/db";
import type { Visit } from "../../shared/types";
import {
	formatDuration,
	formatRelativeTime,
	getFaviconUrl,
} from "../../shared/utils";
import { extractSnippet } from "../lib/search";
import { useToast } from "./Toast";

const FaviconImg = ({
	favIconUrl,
	domain,
}: {
	favIconUrl: string | undefined;
	domain: string;
}) => {
	const safeUrl = getFaviconUrl(favIconUrl, domain);
	if (safeUrl) {
		return (
			<img
				src={safeUrl}
				alt={domain}
				className="w-5 h-5 mt-0.5 rounded flex-shrink-0"
				loading="lazy"
			/>
		);
	}
	return (
		<div className="w-5 h-5 mt-0.5 rounded flex-shrink-0 bg-sand-200 dark:bg-sand-700 flex items-center justify-center text-[10px] font-bold text-sand-500 dark:text-sand-400 uppercase">
			{domain.charAt(0)}
		</div>
	);
};

interface VisitCardProps {
	visit: Visit;
	query?: string;
	showDelete?: boolean;
	selected?: boolean;
	onSelect?: (visit: Visit) => void;
	checked?: boolean;
	onCheck?: (visit: Visit) => void;
}

const HighlightedText = ({
	text,
	query,
}: {
	text: string;
	query: string;
}) => {
	if (!query) return <>{text}</>;
	const firstTerm = query
		.toLowerCase()
		.split(/\s+/)
		.find((t) => t.length > 0);
	if (!firstTerm) return <>{text}</>;
	const idx = text.toLowerCase().indexOf(firstTerm);
	if (idx === -1) return <>{text}</>;
	return (
		<>
			{text.slice(0, idx)}
			<mark className="bg-honey-200/70 dark:bg-honey-800/40 text-inherit rounded-sm px-0.5">
				{text.slice(idx, idx + firstTerm.length)}
			</mark>
			{text.slice(idx + firstTerm.length)}
		</>
	);
};

const getPathname = (url: string): string => {
	try {
		const path = new URL(url).pathname;
		return path === "/" ? "" : path.slice(0, 60);
	} catch {
		return "";
	}
};

export const VisitCard = ({
	visit,
	query,
	showDelete = true,
	selected = false,
	onSelect,
	checked,
	onCheck,
}: VisitCardProps) => {
	const snippet = query ? extractSnippet(visit, query) : null;
	const pathname = getPathname(visit.url);
	const { toast } = useToast();

	const handleDelete = async (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (visit.id) {
			const sessionId = visit.sessionId;
			await db.visits.delete(visit.id);
			if (sessionId) await refreshSession(sessionId);
			toast("Visit removed", "info");
		}
	};

	const handleCopy = async (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		await navigator.clipboard.writeText(visit.url);
		toast("URL copied to clipboard");
	};

	const handleClick = (e: React.MouseEvent) => {
		if (onCheck) {
			e.preventDefault();
			onCheck(visit);
			return;
		}
		if (onSelect) {
			e.preventDefault();
			onSelect(visit);
		}
	};

	return (
		<a
			href={visit.url}
			target="_blank"
			rel="noopener noreferrer"
			onClick={handleClick}
			data-visit-id={visit.id}
			className={`flex gap-3 px-3 py-2.5 -mx-1 rounded-lg transition-colors group ${
				selected
					? "bg-honey-50/80 dark:bg-honey-900/10 ring-1 ring-honey-200 dark:ring-honey-800/40"
					: checked
						? "bg-honey-50/50 dark:bg-honey-900/5"
						: "hover:bg-sand-100/70 dark:hover:bg-sand-800/40"
			}`}
		>
			{onCheck !== undefined && (
				<div className="flex items-center mt-0.5 flex-shrink-0">
					<div
						className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
							checked
								? "bg-honey-500 border-honey-500"
								: "border-sand-300 dark:border-sand-600"
						}`}
					>
						{checked && (
							<svg
								className="w-2.5 h-2.5 text-white"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={3}
									d="M5 13l4 4L19 7"
								/>
							</svg>
						)}
					</div>
				</div>
			)}
			<FaviconImg favIconUrl={visit.favIconUrl} domain={visit.domain} />
			<div className="min-w-0 flex-1">
				<div className="flex items-start justify-between gap-3">
					<h3 className="text-[13px] font-medium text-sand-800 dark:text-sand-200 truncate leading-snug group-hover:text-honey-700 dark:group-hover:text-honey-400 transition-colors">
						{query ? (
							<HighlightedText text={visit.title || visit.url} query={query} />
						) : (
							visit.title || visit.url
						)}
					</h3>
					<div className="flex items-center gap-1.5 flex-shrink-0 text-sand-400 mt-0.5">
						{visit.duration > 0 && (
							<span className="text-[10px] font-medium tabular-nums px-1.5 py-0.5 bg-sand-100 dark:bg-sand-800 rounded">
								{formatDuration(visit.duration)}
							</span>
						)}
						{visit.scrollDepth > 0 && (
							<span
								className="text-[10px] font-medium tabular-nums px-1.5 py-0.5 bg-moss-50 dark:bg-moss-600/10 text-moss-500 dark:text-moss-400 rounded"
								title={`Scrolled ${visit.scrollDepth}% of page`}
							>
								{visit.scrollDepth}%
							</span>
						)}
						<span className="text-[11px] hidden sm:inline tabular-nums">
							{formatRelativeTime(visit.timestamp)}
						</span>

						{/* Hover actions */}
						<div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity ml-0.5">
							<button
								type="button"
								onClick={handleCopy}
								className="p-1 rounded hover:bg-sand-200 dark:hover:bg-sand-700 transition-colors"
								title="Copy URL"
							>
								<svg
									className="w-3 h-3"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
									/>
								</svg>
							</button>
							{showDelete && (
								<button
									type="button"
									onClick={handleDelete}
									className="p-1 rounded hover:bg-coral-50 dark:hover:bg-coral-500/10 hover:text-coral-500 transition-colors"
									title="Remove from history"
								>
									<svg
										className="w-3 h-3"
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
							)}
						</div>
					</div>
				</div>
				<p className="text-[11px] text-sand-400 truncate mt-0.5">
					{visit.domain}
					{pathname && (
						<span className="text-sand-300 dark:text-sand-600">{pathname}</span>
					)}
				</p>
				{snippet && (
					<p className="text-[11px] text-sand-500 dark:text-sand-400 mt-1.5 leading-relaxed line-clamp-2 bg-sand-50 dark:bg-sand-800/30 rounded px-2 py-1.5 border border-sand-100 dark:border-sand-800">
						{query ? <HighlightedText text={snippet} query={query} /> : snippet}
					</p>
				)}
			</div>
		</a>
	);
};
