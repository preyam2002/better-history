export interface Visit {
	id?: number;
	url: string;
	title: string;
	domain: string;
	favIconUrl?: string;
	timestamp: number;
	duration: number;
	scrollDepth: number;
	textContent?: string;
	sessionId?: number;
	fromImport?: boolean;
}

export interface Session {
	id?: number;
	startTime: number;
	endTime: number;
	visitCount: number;
	topDomain?: string;
	label?: string;
}

export interface Settings {
	sessionGapMinutes: number;
	importCompleted: boolean;
	theme: "system" | "light" | "dark";
	excludedDomains: string[];
	autoPruneMonths: number | null;
}

export type ViewTab = "search" | "timeline" | "analytics" | "settings";

export interface SearchFilters {
	query: string;
	domains: string[];
	dateRange: { start: number; end: number } | null;
	minDuration: number | null;
	sortBy: "recent" | "duration" | "visits";
}

export interface TrackingState {
	activeTabId: number | null;
	activeTabStartTime: number;
	pendingVisitId: number | null;
	currentSessionId: number | null;
}

export type MessageType =
	| "UPDATE_VISIT_METRICS"
	| "IMPORT_PROGRESS"
	| "GET_SETTINGS"
	| "UPDATE_SETTINGS";

export interface VisitMetricsMessage {
	type: "UPDATE_VISIT_METRICS";
	scrollDepth: number;
	textContent?: string;
}

export interface ImportProgressMessage {
	type: "IMPORT_PROGRESS";
	current: number;
	total: number;
	done: boolean;
}
