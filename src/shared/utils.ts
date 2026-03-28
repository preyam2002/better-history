import { SAFE_URL_PROTOCOLS } from "./constants";

export const extractDomain = (url: string): string => {
	try {
		return new URL(url).hostname;
	} catch {
		return url;
	}
};

export const formatDuration = (seconds: number): string => {
	if (seconds < 60) return `${seconds}s`;
	if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
	const h = Math.floor(seconds / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

export const formatRelativeTime = (timestamp: number): string => {
	const diff = Date.now() - timestamp;
	const seconds = Math.floor(diff / 1000);
	if (seconds < 60) return "just now";
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	if (days < 7) return `${days}d ago`;
	return new Date(timestamp).toLocaleDateString();
};

export const formatDate = (timestamp: number): string => {
	const date = new Date(timestamp);
	const today = new Date();
	const yesterday = new Date(today);
	yesterday.setDate(yesterday.getDate() - 1);

	if (date.toDateString() === today.toDateString()) return "Today";
	if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
	return date.toLocaleDateString("en-US", {
		weekday: "long",
		month: "long",
		day: "numeric",
	});
};

export const formatTime = (timestamp: number): string =>
	new Date(timestamp).toLocaleTimeString("en-US", {
		hour: "numeric",
		minute: "2-digit",
	});

const isSafeUrl = (url: string): boolean => {
	try {
		const parsed = new URL(url);
		return (SAFE_URL_PROTOCOLS as readonly string[]).includes(parsed.protocol);
	} catch {
		return false;
	}
};

export const getFaviconUrl = (
	favIconUrl: string | undefined,
	_domain: string,
): string | null => {
	if (favIconUrl && isSafeUrl(favIconUrl)) return favIconUrl;
	return null;
};

export const extractSnippet = (
	text: string,
	query: string,
	maxLength = 150,
): string | null => {
	if (!text || !query) return null;
	const lower = text.toLowerCase();
	const idx = lower.indexOf(query.toLowerCase());
	if (idx === -1) return null;

	const start = Math.max(0, idx - Math.floor(maxLength / 3));
	const end = Math.min(text.length, start + maxLength);
	let snippet = text.slice(start, end).trim();
	if (start > 0) snippet = `...${snippet}`;
	if (end < text.length) snippet = `${snippet}...`;
	return snippet;
};

export const groupByDate = <T extends { timestamp: number }>(
	items: T[],
): Map<string, T[]> => {
	const groups = new Map<string, T[]>();
	for (const item of items) {
		const key = new Date(item.timestamp).toDateString();
		const group = groups.get(key);
		if (group) {
			group.push(item);
		} else {
			groups.set(key, [item]);
		}
	}
	return groups;
};
