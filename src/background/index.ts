import { db } from "../shared/db";
import type { TrackingState, VisitMetricsMessage } from "../shared/types";
import {
	EXCLUDED_URL_PREFIXES,
	SESSION_GAP_MS,
	MAX_IMPORT_DAYS,
	DEFAULT_SETTINGS,
} from "../shared/constants";
import { extractDomain } from "../shared/utils";
import { sanitizeText, isValidUrl } from "./helpers";

let state: TrackingState = {
	activeTabId: null,
	activeTabStartTime: Date.now(),
	pendingVisitId: null,
	currentSessionId: null,
};

const saveState = async () => {
	await chrome.storage.session.set({ trackingState: state });
};

const restoreState = async () => {
	const stored = await chrome.storage.session.get("trackingState");
	if (stored.trackingState) {
		state = stored.trackingState as TrackingState;
	}
};

const isExcludedUrl = async (url: string): Promise<boolean> => {
	if (!url || EXCLUDED_URL_PREFIXES.some((prefix) => url.startsWith(prefix)))
		return true;

	const result = await chrome.storage.sync.get("settings");
	const excluded: string[] = result.settings?.excludedDomains ?? [];
	if (excluded.length === 0) return false;

	const domain = extractDomain(url);
	return excluded.some((d) => domain === d || domain.endsWith(`.${d}`));
};

const getSessionGapMs = async (): Promise<number> => {
	const result = await chrome.storage.sync.get("settings");
	const settings = result.settings ?? DEFAULT_SETTINGS;
	return (settings.sessionGapMinutes ?? 30) * 60 * 1000;
};

const getOrCreateSession = async (timestamp: number): Promise<number> => {
	const gapMs = await getSessionGapMs();

	if (state.currentSessionId) {
		const session = await db.sessions.get(state.currentSessionId);
		if (session && timestamp - session.endTime < gapMs) {
			await db.sessions.update(state.currentSessionId, {
				endTime: timestamp,
				visitCount: session.visitCount + 1,
			});
			return state.currentSessionId;
		}
	}

	const id = await db.sessions.add({
		startTime: timestamp,
		endTime: timestamp,
		visitCount: 1,
	});
	state.currentSessionId = id as number;
	await saveState();
	return id as number;
};

const finalizeCurrentVisit = async () => {
	if (!state.pendingVisitId || !state.activeTabStartTime) return;

	const duration = Math.floor((Date.now() - state.activeTabStartTime) / 1000);
	if (duration > 0) {
		await db.visits.update(state.pendingVisitId, { duration });
	}
};

const recordVisit = async (tab: chrome.tabs.Tab) => {
	if (!tab.url || !isValidUrl(tab.url) || (await isExcludedUrl(tab.url)))
		return;

	await finalizeCurrentVisit();

	const now = Date.now();
	const domain = extractDomain(tab.url);
	const sessionId = await getOrCreateSession(now);

	const id = await db.visits.add({
		url: tab.url,
		title: tab.title ?? "",
		domain,
		favIconUrl: tab.favIconUrl,
		timestamp: now,
		duration: 0,
		scrollDepth: 0,
		sessionId,
	});

	state.activeTabId = tab.id ?? null;
	state.activeTabStartTime = now;
	state.pendingVisitId = id as number;
	await saveState();

	await updateSessionTopDomain(sessionId);
};

const updateSessionTopDomain = async (sessionId: number) => {
	const visits = await db.visits.where("sessionId").equals(sessionId).toArray();
	const domainCounts = new Map<string, number>();
	for (const v of visits) {
		domainCounts.set(v.domain, (domainCounts.get(v.domain) ?? 0) + 1);
	}
	let topDomain = "";
	let maxCount = 0;
	for (const [domain, count] of domainCounts) {
		if (count > maxCount) {
			topDomain = domain;
			maxCount = count;
		}
	}
	await db.sessions.update(sessionId, { topDomain });
};

// Tab activated — user switched to a different tab
chrome.tabs.onActivated.addListener(async (activeInfo) => {
	try {
		const tab = await chrome.tabs.get(activeInfo.tabId);
		await recordVisit(tab);
	} catch {
		// Tab may have been closed between event and get
	}
});

// Tab updated — page finished loading (new URL or reload)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
	if (changeInfo.status !== "complete" || !tab.url) return;
	if (state.activeTabId !== null && tabId !== state.activeTabId) return;
	try {
		await recordVisit(tab);
	} catch {
		// Ignore errors from closed tabs
	}
});

// Tab removed — finalize duration
chrome.tabs.onRemoved.addListener(async (tabId) => {
	if (tabId === state.activeTabId) {
		await finalizeCurrentVisit();
		state.activeTabId = null;
		state.pendingVisitId = null;
		await saveState();
	}
});

// Idle detection for session boundaries
chrome.idle.setDetectionInterval(30 * 60);
chrome.idle.onStateChanged.addListener(async (idleState) => {
	if (idleState === "idle" || idleState === "locked") {
		await finalizeCurrentVisit();
		state.currentSessionId = null;
		await saveState();
	}
});

// Messages from content script — validate sender
chrome.runtime.onMessage.addListener(
	(message: VisitMetricsMessage, sender, sendResponse) => {
		// Only accept messages from our own extension
		if (sender.id !== chrome.runtime.id) {
			sendResponse({ ok: false });
			return;
		}

		if (message.type === "UPDATE_VISIT_METRICS" && state.pendingVisitId) {
			const updates: Record<string, unknown> = {};

			if (
				typeof message.scrollDepth === "number" &&
				message.scrollDepth >= 0 &&
				message.scrollDepth <= 100
			) {
				updates.scrollDepth = message.scrollDepth;
			}

			if (
				typeof message.textContent === "string" &&
				message.textContent.length > 0
			) {
				// Sanitize: strip control chars, limit size
				updates.textContent = sanitizeText(message.textContent);
			}

			if (Object.keys(updates).length > 0) {
				db.visits.update(state.pendingVisitId, updates).then(() => {
					sendResponse({ ok: true });
				});
				return true;
			}
		}
		sendResponse({ ok: false });
	},
);

// First install — import Chrome history
chrome.runtime.onInstalled.addListener(async (details) => {
	if (details.reason !== "install") return;

	const result = await chrome.storage.sync.get("settings");
	const settings = result.settings ?? { ...DEFAULT_SETTINGS };
	if (settings.importCompleted) return;

	try {
		const startTime = Date.now() - MAX_IMPORT_DAYS * 24 * 60 * 60 * 1000;
		const items = await chrome.history.search({
			text: "",
			startTime,
			maxResults: 100000,
		});

		const filtered = [];
		for (const item of items) {
			if (item.url && !(await isExcludedUrl(item.url))) {
				filtered.push(item);
			}
		}
		const sorted = filtered.sort(
			(a, b) => (a.lastVisitTime ?? 0) - (b.lastVisitTime ?? 0),
		);

		const total = sorted.length;
		let sessionId: number | null = null;
		let lastTimestamp = 0;
		const gapMs = SESSION_GAP_MS;

		const BATCH_SIZE = 500;
		for (let i = 0; i < sorted.length; i += BATCH_SIZE) {
			const batch = sorted.slice(i, i + BATCH_SIZE);
			const visits = [];

			for (const item of batch) {
				const timestamp = item.lastVisitTime ?? Date.now();
				const domain = extractDomain(item.url!);

				if (!sessionId || timestamp - lastTimestamp > gapMs) {
					const newId = await db.sessions.add({
						startTime: timestamp,
						endTime: timestamp,
						visitCount: 0,
					});
					sessionId = newId as number;
				}

				visits.push({
					url: item.url!,
					title: item.title ?? "",
					domain,
					timestamp,
					duration: 0,
					scrollDepth: 0,
					sessionId,
					fromImport: true,
				});

				lastTimestamp = timestamp;
			}

			await db.visits.bulkAdd(visits);

			// Update session visit counts
			const sessionIds = [...new Set(visits.map((v) => v.sessionId))];
			for (const sid of sessionIds) {
				const count = await db.visits.where("sessionId").equals(sid).count();
				const sessionVisits = await db.visits
					.where("sessionId")
					.equals(sid)
					.toArray();
				const last = sessionVisits[sessionVisits.length - 1];
				await db.sessions.update(sid, {
					visitCount: count,
					endTime: last?.timestamp,
				});
			}

			// Broadcast progress
			chrome.runtime.sendMessage({
				type: "IMPORT_PROGRESS",
				current: Math.min(i + BATCH_SIZE, total),
				total,
				done: i + BATCH_SIZE >= total,
			}).catch(() => {});
		}

		settings.importCompleted = true;
		await chrome.storage.sync.set({ settings });
	} catch (err) {
		console.error("[Better History] Import failed:", err);
	}
});

// Auto-prune old text content based on settings
const runAutoPrune = async () => {
	try {
		const result = await chrome.storage.sync.get("settings");
		const months = result.settings?.autoPruneMonths;
		if (!months || months <= 0) return;

		const cutoff = Date.now() - months * 30 * 24 * 60 * 60 * 1000;
		const oldVisits = await db.visits
			.where("timestamp")
			.below(cutoff)
			.toArray();

		const toPrune = oldVisits.filter((v) => v.textContent);
		if (toPrune.length === 0) return;

		await db.transaction("rw", db.visits, async () => {
			for (const visit of toPrune) {
				if (visit.id) {
					await db.visits.update(visit.id, { textContent: undefined });
				}
			}
		});
		console.log(`[Better History] Pruned text content from ${toPrune.length} visits`);
	} catch (err) {
		console.error("[Better History] Auto-prune failed:", err);
	}
};

// Run prune on startup and set alarm for daily
chrome.alarms?.create("auto-prune", { periodInMinutes: 60 * 24 });
chrome.alarms?.onAlarm.addListener((alarm) => {
	if (alarm.name === "auto-prune") runAutoPrune();
});

// Restore state on service worker wake-up
restoreState();
runAutoPrune();

console.log("[Better History] Background service worker loaded");
