import type { Visit, SearchFilters } from "../../shared/types";
import { SEARCH_SNIPPET_LENGTH } from "../../shared/constants";

const searchableText = (visit: Visit): string =>
	`${visit.title}\n${visit.url}\n${visit.textContent ?? ""}`.toLowerCase();

export const matchesQuery = (visit: Visit, query: string): boolean => {
	if (!query) return true;

	const haystack = searchableText(visit);
	const terms = query
		.toLowerCase()
		.split(/\s+/)
		.filter((t) => t.length > 0);

	// All terms must match (AND logic) — allows "react hooks tutorial"
	return terms.every((term) => haystack.includes(term));
};

export const extractSnippet = (
	visit: Visit,
	query: string,
): string | null => {
	if (!query) return null;

	// Use the first term for snippet extraction
	const firstTerm = query
		.toLowerCase()
		.split(/\s+/)
		.find((t) => t.length > 0);
	if (!firstTerm) return null;

	if (visit.textContent) {
		const lower = visit.textContent.toLowerCase();
		const idx = lower.indexOf(firstTerm);
		if (idx !== -1) {
			const start = Math.max(0, idx - 40);
			const end = Math.min(
				visit.textContent.length,
				idx + firstTerm.length + SEARCH_SNIPPET_LENGTH - 40,
			);
			let snippet = visit.textContent.slice(start, end).trim();
			if (start > 0) snippet = `...${snippet}`;
			if (end < visit.textContent.length) snippet = `${snippet}...`;
			return snippet;
		}
	}

	if (visit.title.toLowerCase().includes(firstTerm)) {
		return visit.title;
	}

	return null;
};

export const applyFilters = (
	visits: Visit[],
	filters: SearchFilters,
): Visit[] => {
	let results = visits;

	if (filters.query) {
		results = results.filter((v) => matchesQuery(v, filters.query));
	}

	if (filters.domains.length > 0) {
		results = results.filter((v) => filters.domains.includes(v.domain));
	}

	if (filters.minDuration) {
		results = results.filter((v) => v.duration >= (filters.minDuration ?? 0));
	}

	if (filters.sortBy === "duration") {
		results.sort((a, b) => b.duration - a.duration);
	} else if (filters.sortBy === "recent") {
		results.sort((a, b) => b.timestamp - a.timestamp);
	}

	return results;
};
