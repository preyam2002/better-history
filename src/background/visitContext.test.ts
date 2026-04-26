import { createVisitContextRegistry } from "./visitContext";

describe("createVisitContextRegistry", () => {
	it("keeps metrics attached to the original tab after switching tabs", () => {
		const registry = createVisitContextRegistry();

		registry.trackVisit(1, "https://alpha.test/article", 101);
		registry.registerPage(1, "https://alpha.test/article", "page-alpha");
		registry.trackVisit(2, "https://beta.test", 202);
		registry.registerPage(2, "https://beta.test", "page-beta");

		expect(
			registry.resolveVisit(1, "https://alpha.test/article", "page-alpha"),
		).toBe(101);
		expect(registry.resolveVisit(2, "https://beta.test", "page-beta")).toBe(
			202,
		);
	});

	it("can register a page after focus already moved away", () => {
		const registry = createVisitContextRegistry();

		registry.trackVisit(1, "https://alpha.test/article", 101);
		registry.trackVisit(2, "https://beta.test", 202);

		expect(
			registry.registerPage(1, "https://alpha.test/article", "late-page-alpha"),
		).toBe(101);
	});

	it("distinguishes multiple page instances on the same tab and url", () => {
		const registry = createVisitContextRegistry();

		registry.trackVisit(1, "https://repeat.test/page", 101);
		registry.registerPage(1, "https://repeat.test/page", "page-a");

		registry.trackVisit(1, "https://repeat.test/page", 202);
		registry.registerPage(1, "https://repeat.test/page", "page-b");

		expect(registry.resolveVisit(1, "https://repeat.test/page", "page-a")).toBe(
			101,
		);
		expect(registry.resolveVisit(1, "https://repeat.test/page", "page-b")).toBe(
			202,
		);
	});

	it("drops all contexts when a tab closes", () => {
		const registry = createVisitContextRegistry();

		registry.trackVisit(7, "https://cleanup.test", 707);
		registry.registerPage(7, "https://cleanup.test", "cleanup-page");
		registry.clearTab(7);

		expect(
			registry.resolveVisit(7, "https://cleanup.test", "cleanup-page"),
		).toBe(null);
	});
});
