import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { db } from "../../shared/db";
import { formatDuration } from "../../shared/utils";
import { ConfirmModal } from "../components/ConfirmModal";
import { useToast } from "../components/Toast";
import { useImportHistory } from "../hooks/useImportHistory";
import { useSettings } from "../hooks/useSettings";

export const SettingsView = () => {
	const { settings, updateSettings, loaded } = useSettings();
	const { toast } = useToast();
	const importState = useImportHistory();
	const [newDomain, setNewDomain] = useState("");
	const [clearing, setClearing] = useState(false);
	const [exporting, setExporting] = useState(false);
	const [showClearConfirm, setShowClearConfirm] = useState(false);
	const version = chrome.runtime.getManifest().version;

	const stats = useLiveQuery(async () => {
		const visitCount = await db.visits.count();
		const sessionCount = await db.sessions.count();
		const estimatedMB = ((visitCount * 5) / 1024).toFixed(1);
		return { visitCount, sessionCount, estimatedMB };
	});

	if (!loaded) return null;

	const addExcludedDomain = () => {
		const domain = newDomain.trim().toLowerCase();
		if (domain && !settings.excludedDomains.includes(domain)) {
			updateSettings({
				excludedDomains: [...settings.excludedDomains, domain],
			});
			setNewDomain("");
		}
	};

	const removeExcludedDomain = (domain: string) => {
		updateSettings({
			excludedDomains: settings.excludedDomains.filter((d) => d !== domain),
		});
	};

	const handleExport = async () => {
		setExporting(true);
		try {
			const visits = await db.visits.toArray();
			const sessions = await db.sessions.toArray();
			const blob = new Blob(
				[JSON.stringify({ visits, sessions, exportedAt: Date.now() }, null, 2)],
				{ type: "application/json" },
			);
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `better-history-export-${new Date().toISOString().slice(0, 10)}.json`;
			a.click();
			URL.revokeObjectURL(url);
			toast("History exported successfully");
		} catch {
			toast("Export failed. Please try again.", "error");
		}
		setExporting(false);
	};

	const handleClearData = async () => {
		setClearing(true);
		await db.visits.clear();
		await db.sessions.clear();
		updateSettings({ importCompleted: false });
		setClearing(false);
		setShowClearConfirm(false);
		toast(
			"All data cleared. You can restore the last 90 days anytime.",
			"info",
		);
	};

	const handleRestoreHistory = async () => {
		try {
			const response = await chrome.runtime.sendMessage({
				type: "START_HISTORY_IMPORT",
			});
			if (response?.ok) {
				toast("Import started", "info");
				return;
			}
		} catch {
			// handled below
		}
		toast("Could not start the history import.", "error");
	};

	return (
		<div className="max-w-lg space-y-6">
			{/* Session Gap */}
			<SettingsSection
				title="Session Detection"
				description="A new browsing session starts after this period of inactivity."
			>
				<div className="flex items-center gap-4">
					<input
						type="range"
						min={5}
						max={120}
						step={5}
						value={settings.sessionGapMinutes}
						onChange={(e) =>
							updateSettings({ sessionGapMinutes: Number(e.target.value) })
						}
						className="flex-1 h-1 accent-honey-500 cursor-pointer"
					/>
					<span className="text-[13px] font-mono w-14 text-right bg-sand-100 dark:bg-sand-800 px-2.5 py-1 rounded-md text-sand-600 dark:text-sand-300 tabular-nums">
						{formatDuration(settings.sessionGapMinutes * 60)}
					</span>
				</div>
			</SettingsSection>

			{/* Theme */}
			<SettingsSection title="Appearance">
				<div className="flex gap-2">
					{(["system", "light", "dark"] as const).map((theme) => (
						<button
							type="button"
							key={theme}
							onClick={() => updateSettings({ theme })}
							className={`flex-1 px-3 py-2 rounded-lg text-[13px] capitalize transition-all duration-200 ${
								settings.theme === theme
									? "bg-honey-100 text-honey-800 dark:bg-honey-900/30 dark:text-honey-300 ring-1 ring-honey-200 dark:ring-honey-800/50"
									: "bg-sand-100 text-sand-500 dark:bg-sand-800 dark:text-sand-400 hover:bg-sand-200 dark:hover:bg-sand-700"
							}`}
						>
							{theme}
						</button>
					))}
				</div>
			</SettingsSection>

			{/* Excluded Domains */}
			<SettingsSection
				title="Excluded Domains"
				description="Pages from these domains won't be tracked or stored."
			>
				<div className="flex gap-2 mb-3">
					<input
						type="text"
						value={newDomain}
						onChange={(e) => setNewDomain(e.target.value)}
						onKeyDown={(e) => e.key === "Enter" && addExcludedDomain()}
						placeholder="example.com"
						className="flex-1 px-3 py-2 text-[13px] bg-white dark:bg-sand-900 border border-sand-200 dark:border-sand-700 rounded-lg focus:outline-none focus:border-honey-300 dark:focus:border-honey-700 focus:shadow-[0_0_0_3px_rgba(196,160,60,0.08)] text-sand-700 dark:text-sand-300 placeholder:text-sand-400"
					/>
					<button
						type="button"
						onClick={addExcludedDomain}
						disabled={!newDomain.trim()}
						className="px-4 py-2 text-[13px] bg-sand-800 dark:bg-sand-200 text-white dark:text-sand-900 rounded-lg hover:bg-sand-700 dark:hover:bg-sand-300 disabled:opacity-30 transition-colors font-medium"
					>
						Add
					</button>
				</div>
				{settings.excludedDomains.length > 0 ? (
					<div className="flex flex-wrap gap-1.5">
						{settings.excludedDomains.map((domain) => (
							<span
								key={domain}
								className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-sand-100 dark:bg-sand-800 rounded-full text-[11px] text-sand-600 dark:text-sand-400"
							>
								{domain}
								<button
									type="button"
									onClick={() => removeExcludedDomain(domain)}
									className="text-sand-400 hover:text-coral-500 transition-colors"
								>
									×
								</button>
							</span>
						))}
					</div>
				) : (
					<p className="text-[11px] text-sand-400 italic">
						No excluded domains. All pages are tracked.
					</p>
				)}
			</SettingsSection>

			{/* Auto-Prune */}
			<SettingsSection
				title="Storage Management"
				description="Automatically delete extracted page content older than a set period to save space. Visit metadata (title, URL, duration) is always kept."
			>
				<div className="flex gap-2">
					{(
						[
							{ label: "Never", value: null },
							{ label: "3 months", value: 3 },
							{ label: "6 months", value: 6 },
							{ label: "12 months", value: 12 },
						] as const
					).map((opt) => (
						<button
							type="button"
							key={String(opt.value)}
							onClick={() => updateSettings({ autoPruneMonths: opt.value })}
							className={`flex-1 px-3 py-2 rounded-lg text-[12px] transition-all duration-200 ${
								settings.autoPruneMonths === opt.value
									? "bg-honey-100 text-honey-800 dark:bg-honey-900/30 dark:text-honey-300 ring-1 ring-honey-200 dark:ring-honey-800/50 font-medium"
									: "bg-sand-100 text-sand-500 dark:bg-sand-800 dark:text-sand-400 hover:bg-sand-200 dark:hover:bg-sand-700"
							}`}
						>
							{opt.label}
						</button>
					))}
				</div>
			</SettingsSection>

			{/* Data Management */}
			<SettingsSection title="Data">
				{stats?.visitCount === 0 && (
					<div className="mb-4 rounded-lg border border-honey-200 dark:border-honey-800/40 bg-honey-50/70 dark:bg-honey-900/10 px-4 py-3">
						<p className="text-[12px] text-honey-800 dark:text-honey-300 font-medium">
							Restore the last {90} days from Chrome history
						</p>
						<p className="mt-1 text-[11px] text-honey-700 dark:text-honey-400 leading-relaxed">
							This rebuilds your local Better History index from the browser
							history already on this device.
						</p>
						{importState.importing && !importState.done ? (
							<div className="mt-3">
								<div className="h-1 rounded-full overflow-hidden bg-honey-100 dark:bg-honey-900/30">
									<div
										className="h-full rounded-full bg-honey-400 transition-all duration-500 ease-out"
										style={{
											width: `${importState.total > 0 ? (importState.current / importState.total) * 100 : 0}%`,
										}}
									/>
								</div>
								<p className="mt-2 text-[11px] text-honey-700 dark:text-honey-400 tabular-nums">
									{importState.current.toLocaleString()} of{" "}
									{importState.total.toLocaleString()} pages
								</p>
							</div>
						) : (
							<button
								type="button"
								onClick={handleRestoreHistory}
								className="mt-3 inline-flex items-center rounded-lg bg-honey-500 px-3 py-2 text-[12px] font-medium text-white transition-colors hover:bg-honey-600 disabled:opacity-50"
							>
								Restore History
							</button>
						)}
					</div>
				)}

				{stats && (
					<div className="grid grid-cols-3 gap-3 mb-4">
						<DataStat
							value={stats.visitCount.toLocaleString()}
							label="visits"
						/>
						<DataStat
							value={stats.sessionCount.toLocaleString()}
							label="sessions"
						/>
						<DataStat value={`~${stats.estimatedMB}`} label="MB stored" />
					</div>
				)}
				<div className="flex gap-2">
					<button
						type="button"
						onClick={handleExport}
						disabled={exporting}
						className="flex-1 px-4 py-2.5 text-[13px] bg-sand-100 dark:bg-sand-800 text-sand-600 dark:text-sand-300 rounded-lg hover:bg-sand-200 dark:hover:bg-sand-700 disabled:opacity-50 transition-colors font-medium"
					>
						{exporting ? "Exporting..." : "Export as JSON"}
					</button>
					<button
						type="button"
						onClick={() => setShowClearConfirm(true)}
						disabled={clearing}
						className="flex-1 px-4 py-2.5 text-[13px] text-coral-500 bg-coral-50 dark:bg-coral-500/5 rounded-lg hover:bg-coral-100 dark:hover:bg-coral-500/10 disabled:opacity-50 transition-colors font-medium"
					>
						{clearing ? "Clearing..." : "Clear All Data"}
					</button>
				</div>
			</SettingsSection>

			<SettingsSection
				title="Privacy"
				description="Better History exists to organize and search your browsing history. All indexed data stays on-device."
			>
				<div className="space-y-2 text-[12px] text-sand-500 dark:text-sand-400 leading-relaxed">
					<p>
						Page titles, URLs, timestamps, scroll depth, and extracted text are
						stored locally in your browser for search, timeline grouping, and
						analytics.
					</p>
					<p>
						No browsing data is sent to external servers, sold, or used for ads.
						You can export or delete everything from the Data section above.
					</p>
				</div>
			</SettingsSection>

			{/* Footer */}
			<div className="pt-4 border-t border-sand-200 dark:border-sand-800">
				<div className="flex items-center justify-between text-[11px] text-sand-400">
					<span className="font-serif italic">Better History v{version}</span>
					<span>All data stored locally</span>
				</div>
			</div>

			{/* Shortcuts */}
			<SettingsSection title="Keyboard Shortcuts">
				<div className="space-y-2 text-[11px] text-sand-500 dark:text-sand-400">
					{(
						[
							["Focus search", "⌘K"],
							["Switch tabs", "Alt + 1-4"],
							["Navigate results", "↑ / ↓ or j / k"],
							["Open detail panel", "Enter"],
							["Open in new tab", "O"],
							["Close panel / blur", "Escape"],
						] as const
					).map(([label, key]) => (
						<div key={label} className="flex items-center justify-between">
							<span>{label}</span>
							<kbd className="px-2 py-0.5 bg-sand-50 dark:bg-sand-850 rounded text-[10px] font-mono border border-sand-200 dark:border-sand-700 text-sand-400">
								{key}
							</kbd>
						</div>
					))}
				</div>
			</SettingsSection>

			<ConfirmModal
				open={showClearConfirm}
				title="Clear all browsing data?"
				description="This will permanently delete all your visits, sessions, and extracted content. This cannot be undone."
				confirmLabel="Clear Everything"
				destructive
				onConfirm={handleClearData}
				onCancel={() => setShowClearConfirm(false)}
			/>
		</div>
	);
};

const SettingsSection = ({
	title,
	description,
	children,
}: {
	title: string;
	description?: string;
	children: React.ReactNode;
}) => (
	<section className="bg-white dark:bg-sand-900/50 rounded-xl border border-sand-200 dark:border-sand-800 p-5">
		<h3 className="text-[13px] font-semibold text-sand-700 dark:text-sand-200 mb-1">
			{title}
		</h3>
		{description && (
			<p className="text-[11px] text-sand-400 mb-3">{description}</p>
		)}
		{!description && <div className="mb-3" />}
		{children}
	</section>
);

const DataStat = ({ value, label }: { value: string; label: string }) => (
	<div className="text-center p-3 bg-sand-50 dark:bg-sand-850 rounded-lg">
		<div className="text-lg font-bold text-sand-800 dark:text-sand-200 tabular-nums">
			{value}
		</div>
		<div className="text-[10px] text-sand-400 tracking-wide uppercase">
			{label}
		</div>
	</div>
);
