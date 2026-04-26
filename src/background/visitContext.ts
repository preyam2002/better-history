interface VisitContext {
	visitId: number;
	url: string;
	pageKey?: string;
	createdAt: number;
}

const MAX_CONTEXTS_PER_TAB = 10;

const findBestContext = (
	contexts: VisitContext[],
	url: string,
): VisitContext | null => {
	const matching = contexts.filter((context) => context.url === url);
	if (matching.length === 0) return null;

	const unregistered = [...matching]
		.reverse()
		.find((context) => !context.pageKey);
	return unregistered ?? matching[matching.length - 1] ?? null;
};

export const createVisitContextRegistry = () => {
	const contextsByTab = new Map<number, VisitContext[]>();
	const contextsByPageKey = new Map<string, VisitContext>();

	const pruneContexts = (tabId: number) => {
		const contexts = contextsByTab.get(tabId);
		if (!contexts) return;

		while (contexts.length > MAX_CONTEXTS_PER_TAB) {
			const removed = contexts.shift();
			if (removed?.pageKey) {
				contextsByPageKey.delete(removed.pageKey);
			}
		}

		if (contexts.length === 0) {
			contextsByTab.delete(tabId);
		}
	};

	return {
		trackVisit(
			tabId: number,
			url: string,
			visitId: number,
			createdAt = Date.now(),
		) {
			const contexts = contextsByTab.get(tabId) ?? [];
			contexts.push({ visitId, url, createdAt });
			contextsByTab.set(tabId, contexts);
			pruneContexts(tabId);
		},

		registerPage(tabId: number, url: string, pageKey: string): number | null {
			const existing = contextsByPageKey.get(pageKey);
			if (existing) return existing.visitId;

			const contexts = contextsByTab.get(tabId);
			if (!contexts) return null;

			const context = findBestContext(contexts, url);
			if (!context) return null;

			if (context.pageKey && context.pageKey !== pageKey) {
				contextsByPageKey.delete(context.pageKey);
			}

			context.pageKey = pageKey;
			contextsByPageKey.set(pageKey, context);
			return context.visitId;
		},

		resolveVisit(tabId: number, url: string, pageKey: string): number | null {
			const existing = contextsByPageKey.get(pageKey);
			if (existing) return existing.visitId;
			return this.registerPage(tabId, url, pageKey);
		},

		clearTab(tabId: number) {
			const contexts = contextsByTab.get(tabId);
			if (!contexts) return;

			for (const context of contexts) {
				if (context.pageKey) {
					contextsByPageKey.delete(context.pageKey);
				}
			}

			contextsByTab.delete(tabId);
		},
	};
};
