import { extractPageContent } from "./extractor";

const pageKey =
	crypto.randomUUID?.() ??
	`${Date.now()}-${Math.random().toString(36).slice(2)}`;

const sendMessage = (
	payload:
		| {
				type: "REGISTER_PAGE_CONTEXT";
				pageKey: string;
				url: string;
		  }
		| {
				type: "UPDATE_VISIT_METRICS";
				pageKey: string;
				url: string;
				scrollDepth: number;
				textContent?: string;
		  },
) => chrome.runtime.sendMessage(payload).catch(() => {});

let maxScrollDepth = 0;
let contentExtracted = false;

const updateScrollDepth = () => {
	const scrollTop =
		document.documentElement.scrollTop || document.body.scrollTop;
	const scrollHeight =
		document.documentElement.scrollHeight -
		document.documentElement.clientHeight;
	if (scrollHeight > 0) {
		const depth = Math.round((scrollTop / scrollHeight) * 100);
		maxScrollDepth = Math.max(maxScrollDepth, depth);
	}
};

const reportMetrics = () => {
	const payload: {
		type: "UPDATE_VISIT_METRICS";
		pageKey: string;
		url: string;
		scrollDepth: number;
		textContent?: string;
	} = {
		type: "UPDATE_VISIT_METRICS",
		pageKey,
		url: window.location.href,
		scrollDepth: maxScrollDepth,
	};

	if (!contentExtracted) {
		try {
			const text = extractPageContent();
			if (text.length > 50) {
				payload.textContent = text;
				contentExtracted = true;
			}
		} catch {
			// Extraction can fail on some pages — that's fine
		}
	}

	sendMessage(payload);
};

sendMessage({
	type: "REGISTER_PAGE_CONTEXT",
	pageKey,
	url: window.location.href,
});

window.addEventListener("scroll", updateScrollDepth, { passive: true });

document.addEventListener("visibilitychange", () => {
	if (document.visibilityState === "hidden") {
		reportMetrics();
	}
});

// Also extract content after page settles (for pages user doesn't leave quickly)
setTimeout(() => {
	if (!contentExtracted) {
		reportMetrics();
	}
}, 3000);
