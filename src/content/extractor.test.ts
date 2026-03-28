import { describe, it, expect, beforeEach } from "vitest";
import { extractPageContent } from "./extractor";

describe("extractPageContent", () => {
	beforeEach(() => {
		document.body.innerHTML = "";
	});

	it("extracts content from <article> element", () => {
		document.body.innerHTML = `
			<nav>Navigation stuff</nav>
			<article>This is the main article content about React hooks and their usage.</article>
			<footer>Footer stuff</footer>
		`;
		const content = extractPageContent();
		expect(content).toContain("React hooks");
		expect(content).not.toContain("Navigation stuff");
	});

	it("extracts content from <main> element", () => {
		document.body.innerHTML = `
			<header>Header</header>
			<main>Main content about TypeScript generics and type safety.</main>
			<aside>Sidebar</aside>
		`;
		const content = extractPageContent();
		expect(content).toContain("TypeScript generics");
	});

	it("extracts meta description", () => {
		const meta = document.createElement("meta");
		meta.setAttribute("name", "description");
		meta.setAttribute("content", "A guide to modern JavaScript");
		document.head.appendChild(meta);

		document.body.innerHTML = `<article>Some content here</article>`;
		const content = extractPageContent();
		expect(content).toContain("modern JavaScript");
		document.head.removeChild(meta);
	});

	it("extracts h1", () => {
		document.body.innerHTML = `
			<h1>Understanding WebAssembly</h1>
			<article>Content about WebAssembly and its benefits.</article>
		`;
		const content = extractPageContent();
		expect(content).toContain("Understanding WebAssembly");
	});

	it("falls back to paragraph text when no semantic elements", () => {
		document.body.innerHTML = `
			<div>
				<p>This is paragraph one with substantial content to pass the length check for the extractor.</p>
				<p>This is paragraph two with additional content about software engineering best practices.</p>
				<p>This is paragraph three with even more content about programming languages and tools.</p>
			</div>
		`;
		const content = extractPageContent();
		expect(content.length).toBeGreaterThan(50);
		expect(content).toContain("paragraph");
	});

	it("falls back to highest density block", () => {
		document.body.innerHTML = `
			<div class="sidebar">Short nav</div>
			<div id="content">
				${"This is substantial content that should be detected as the main block. ".repeat(5)}
			</div>
		`;
		const content = extractPageContent();
		expect(content).toContain("substantial content");
	});

	it("strips nav, header, footer, aside", () => {
		document.body.innerHTML = `
			<nav>Nav links here</nav>
			<header>Header content</header>
			<div>
				<p>Real content paragraph one with enough text to qualify as content.</p>
				<p>Real content paragraph two with more text to qualify for extraction.</p>
				<p>Real content paragraph three with sufficient text length for detection.</p>
			</div>
			<footer>Footer info</footer>
			<aside>Sidebar</aside>
		`;
		const content = extractPageContent();
		expect(content).not.toContain("Nav links");
		expect(content).not.toContain("Footer info");
		expect(content).not.toContain("Sidebar");
	});

	it("truncates to MAX_TEXT_CONTENT_LENGTH", () => {
		document.body.innerHTML = `<article>${"x".repeat(10000)}</article>`;
		const content = extractPageContent();
		expect(content.length).toBeLessThanOrEqual(5000);
	});

	it("collapses whitespace", () => {
		document.body.innerHTML = `<article>hello     world\n\n\n\nfoo</article>`;
		const content = extractPageContent();
		expect(content).not.toContain("     ");
	});

	it("handles empty body", () => {
		document.body.innerHTML = "";
		const content = extractPageContent();
		expect(content).toBe("");
	});
});
