import { MAX_TEXT_CONTENT_LENGTH } from "../shared/constants";

export const sanitizeText = (text: string): string =>
	text
		// Strip control characters except newline/tab
		.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
		// Strip zero-width characters
		.replace(/[\u200B-\u200F\u2028-\u202F\uFEFF]/g, "")
		// Collapse whitespace
		.replace(/\s+/g, " ")
		.trim()
		.slice(0, MAX_TEXT_CONTENT_LENGTH);

export const isValidUrl = (url: string): boolean => {
	try {
		const parsed = new URL(url);
		return parsed.protocol === "https:" || parsed.protocol === "http:";
	} catch {
		return false;
	}
};
