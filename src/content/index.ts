import { extractPageContent } from "./extractor";

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
		scrollDepth: number;
		textContent?: string;
	} = {
		type: "UPDATE_VISIT_METRICS",
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

	chrome.runtime.sendMessage(payload).catch(() => {});
};

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
