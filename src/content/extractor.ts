import { MAX_TEXT_CONTENT_LENGTH } from "../shared/constants";

const STRIP_SELECTORS = [
	"nav",
	"header",
	"footer",
	"aside",
	"script",
	"style",
	"noscript",
	"svg",
	"form",
	"iframe",
	"[role='navigation']",
	"[role='banner']",
	"[role='contentinfo']",
	"[aria-hidden='true']",
	".sidebar",
	".menu",
	".nav",
	".footer",
	".header",
	".ad",
	".advertisement",
	".cookie-banner",
	".popup",
	".modal",
	".comments",
	".comment",
	"#comments",
];

const getTextDensity = (el: Element): number => {
	const text = el.textContent?.trim() ?? "";
	const html = el.innerHTML;
	if (!html || html.length === 0) return 0;
	return text.length / html.length;
};

const cleanText = (text: string): string =>
	text
		.replace(/\s+/g, " ")
		.replace(/\n\s*\n/g, "\n")
		.trim()
		.slice(0, MAX_TEXT_CONTENT_LENGTH);

const getMetaContent = (): string => {
	const desc =
		document.querySelector('meta[name="description"]')?.getAttribute("content") ??
		document.querySelector('meta[property="og:description"]')?.getAttribute("content") ??
		"";
	return desc.trim();
};

export const extractPageContent = (): string => {
	const parts: string[] = [];

	// Meta description gives a good summary
	const meta = getMetaContent();
	if (meta) parts.push(meta);

	// H1 is usually the most important heading
	const h1 = document.querySelector("h1");
	if (h1?.textContent) parts.push(h1.textContent.trim());

	// Try semantic content elements
	const article = document.querySelector("article");
	if (article) {
		parts.push(cleanText(article.textContent ?? ""));
		return parts.join(" | ").slice(0, MAX_TEXT_CONTENT_LENGTH);
	}

	const main = document.querySelector("main, [role='main']");
	if (main) {
		parts.push(cleanText(main.textContent ?? ""));
		return parts.join(" | ").slice(0, MAX_TEXT_CONTENT_LENGTH);
	}

	// Fall back to highest text-density block
	const clone = document.body.cloneNode(true) as HTMLElement;
	for (const selector of STRIP_SELECTORS) {
		for (const el of clone.querySelectorAll(selector)) {
			el.remove();
		}
	}

	// Collect <p> tags first — they're almost always content
	const paragraphs = clone.querySelectorAll("p");
	if (paragraphs.length >= 3) {
		const pText = Array.from(paragraphs)
			.map((p) => p.textContent?.trim() ?? "")
			.filter((t) => t.length > 30)
			.join(" ");
		if (pText.length > 200) {
			parts.push(pText);
			return cleanText(parts.join(" | ")).slice(0, MAX_TEXT_CONTENT_LENGTH);
		}
	}

	// Find the block with the highest text density × length
	const candidates = clone.querySelectorAll(
		"div, section, [role='article'], .content, .post, .entry, #content, #main",
	);

	let bestBlock: Element | null = null;
	let bestScore = 0;

	for (const el of candidates) {
		const text = el.textContent?.trim() ?? "";
		const density = getTextDensity(el);
		const score = text.length * density;
		if (score > bestScore && text.length > 100) {
			bestScore = score;
			bestBlock = el;
		}
	}

	if (bestBlock) parts.push(cleanText(bestBlock.textContent ?? ""));
	else parts.push(cleanText(clone.textContent ?? ""));

	return parts.join(" | ").slice(0, MAX_TEXT_CONTENT_LENGTH);
};
