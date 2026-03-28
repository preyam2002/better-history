import { useState, useEffect, lazy, Suspense, useCallback, useRef } from "react";
import type { ViewTab } from "../shared/types";
import { SearchView } from "./views/SearchView";
import { TimelineView } from "./views/TimelineView";
import { SettingsView } from "./views/SettingsView";
import { useImportHistory } from "./hooks/useImportHistory";

const AnalyticsView = lazy(() =>
	import("./views/AnalyticsView").then((m) => ({ default: m.AnalyticsView })),
);

const tabConfig: {
	id: ViewTab;
	label: string;
	shortcut: string;
}[] = [
	{ id: "search", label: "Search", shortcut: "1" },
	{ id: "timeline", label: "Timeline", shortcut: "2" },
	{ id: "analytics", label: "Analytics", shortcut: "3" },
	{ id: "settings", label: "Settings", shortcut: "4" },
];

const useTheme = () => {
	useEffect(() => {
		const applyTheme = (theme: string) => {
			if (
				theme === "dark" ||
				(theme === "system" &&
					window.matchMedia("(prefers-color-scheme: dark)").matches)
			) {
				document.documentElement.classList.add("dark");
			} else {
				document.documentElement.classList.remove("dark");
			}
		};

		chrome.storage.sync.get("settings").then((result) => {
			applyTheme(result.settings?.theme ?? "system");
		});

		const handler = (changes: {
			[key: string]: chrome.storage.StorageChange;
		}) => {
			if (changes.settings?.newValue?.theme) {
				applyTheme(changes.settings.newValue.theme);
			}
		};
		chrome.storage.sync.onChanged.addListener(handler);

		const mq = window.matchMedia("(prefers-color-scheme: dark)");
		const mqHandler = () => {
			chrome.storage.sync.get("settings").then((result) => {
				if ((result.settings?.theme ?? "system") === "system") {
					applyTheme("system");
				}
			});
		};
		mq.addEventListener("change", mqHandler);

		return () => {
			chrome.storage.sync.onChanged.removeListener(handler);
			mq.removeEventListener("change", mqHandler);
		};
	}, []);
};

const useScrollToTop = () => {
	const [show, setShow] = useState(false);

	useEffect(() => {
		const handleScroll = () => setShow(window.scrollY > 400);
		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	return { show, scroll: () => window.scrollTo({ top: 0, behavior: "smooth" }) };
};

export const App = () => {
	const [activeTab, setActiveTab] = useState<ViewTab>("search");
	const [transitioning, setTransitioning] = useState(false);
	const prevTabRef = useRef<ViewTab>("search");
	useTheme();
	const importState = useImportHistory();
	const { show: showScroll, scroll: scrollToTop } = useScrollToTop();

	const switchTab = useCallback((tab: ViewTab) => {
		if (tab === prevTabRef.current) return;
		setTransitioning(true);
		requestAnimationFrame(() => {
			setActiveTab(tab);
			prevTabRef.current = tab;
			requestAnimationFrame(() => setTransitioning(false));
		});
	}, []);

	const handleKeyDown = useCallback((e: KeyboardEvent) => {
		if (e.altKey && !e.metaKey && !e.ctrlKey) {
			const target = e.target as HTMLElement;
			const isInput =
				target.tagName === "INPUT" ||
				target.tagName === "TEXTAREA" ||
				target.isContentEditable;

			const tab = tabConfig.find((t) => t.shortcut === e.key);
			if (tab && !isInput) {
				e.preventDefault();
				switchTab(tab.id);
			}
		}
	}, [switchTab]);

	useEffect(() => {
		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [handleKeyDown]);

	return (
		<div className="relative max-w-5xl mx-auto px-5 sm:px-8 py-6 sm:py-10 min-h-screen noise">
			{/* Header */}
			<header className="flex items-end justify-between mb-10 sm:mb-12">
				<div>
					<h1 className="font-serif text-2xl sm:text-3xl italic tracking-tight text-sand-900 dark:text-sand-100">
						Better History
					</h1>
					<p className="text-[11px] tracking-[0.15em] uppercase text-sand-400 mt-0.5 font-medium">
						Your browsing, organized
					</p>
				</div>
				<nav
					className="flex items-center gap-0.5"
					role="tablist"
					aria-label="History views"
				>
					{tabConfig.map((tab) => (
						<button
							key={tab.id}
							onClick={() => switchTab(tab.id)}
							role="tab"
							aria-selected={activeTab === tab.id}
							aria-controls={`panel-${tab.id}`}
							title={`${tab.label} (Alt+${tab.shortcut})`}
							className={`relative px-3 sm:px-4 py-2 text-[13px] font-medium transition-colors duration-200 ${
								activeTab === tab.id
									? "text-sand-900 dark:text-sand-100"
									: "text-sand-400 hover:text-sand-600 dark:hover:text-sand-300"
							}`}
						>
							{tab.label}
							{activeTab === tab.id && (
								<span className="absolute bottom-0 left-3 right-3 h-[2px] bg-honey-400 dark:bg-honey-500 rounded-full" />
							)}
						</button>
					))}
				</nav>
			</header>

			{/* Import progress */}
			{importState.importing && !importState.done && (
				<div className="mb-8 px-5 py-4 bg-honey-50 dark:bg-honey-900/10 border border-honey-200 dark:border-honey-800/30 rounded-xl flex items-center gap-4">
					<div className="w-8 h-8 rounded-full bg-honey-100 dark:bg-honey-900/30 flex items-center justify-center flex-shrink-0">
						<svg className="w-4 h-4 text-honey-600 dark:text-honey-400 animate-spin" fill="none" viewBox="0 0 24 24">
							<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
							<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
						</svg>
					</div>
					<div className="flex-1 min-w-0">
						<p className="text-sm font-medium text-honey-800 dark:text-honey-300">
							Importing your Chrome history
						</p>
						<div className="mt-2 h-1 bg-honey-100 dark:bg-honey-900/40 rounded-full overflow-hidden">
							<div
								className="h-full bg-honey-400 rounded-full transition-all duration-500 ease-out"
								style={{ width: `${importState.total > 0 ? (importState.current / importState.total) * 100 : 0}%` }}
							/>
						</div>
						<p className="text-[11px] text-honey-600 dark:text-honey-500 mt-1.5 tabular-nums">
							{importState.current.toLocaleString()} of {importState.total.toLocaleString()} pages
						</p>
					</div>
				</div>
			)}

			{/* Content */}
			<main
				role="tabpanel"
				id={`panel-${activeTab}`}
				aria-label={activeTab}
				className={`transition-all duration-150 ${
					transitioning
						? "opacity-0 translate-y-1"
						: "opacity-100 translate-y-0"
				}`}
			>
				{activeTab === "search" && <SearchView />}
				{activeTab === "timeline" && <TimelineView />}
				{activeTab === "analytics" && (
					<Suspense
						fallback={
							<div className="py-16 text-center">
								<div className="inline-block w-5 h-5 border-2 border-sand-300 dark:border-sand-700 border-t-honey-400 rounded-full animate-spin" />
							</div>
						}
					>
						<AnalyticsView />
					</Suspense>
				)}
				{activeTab === "settings" && <SettingsView />}
			</main>

			{/* Scroll to top */}
			<button
				onClick={scrollToTop}
				className={`fixed bottom-6 right-6 w-9 h-9 bg-sand-100 dark:bg-sand-800 border border-sand-200 dark:border-sand-700 rounded-full shadow-md flex items-center justify-center text-sand-500 hover:text-sand-700 dark:hover:text-sand-300 transition-all duration-300 z-40 ${
					showScroll ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
				}`}
				aria-label="Scroll to top"
			>
				<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
				</svg>
			</button>
		</div>
	);
};
