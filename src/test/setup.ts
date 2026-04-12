import "fake-indexeddb/auto";
import "@testing-library/jest-dom/vitest";

// Mock chrome APIs
const storageMock = {
	sync: {
		get: vi.fn().mockResolvedValue({}),
		set: vi.fn().mockResolvedValue(undefined),
		onChanged: {
			addListener: vi.fn(),
			removeListener: vi.fn(),
		},
	},
	session: {
		get: vi.fn().mockResolvedValue({}),
		set: vi.fn().mockResolvedValue(undefined),
	},
};

const chromeMock = {
	storage: storageMock,
	runtime: {
		id: "mock-extension-id",
		sendMessage: vi.fn().mockResolvedValue(undefined),
		onMessage: {
			addListener: vi.fn(),
			removeListener: vi.fn(),
		},
		onInstalled: {
			addListener: vi.fn(),
		},
	},
	tabs: {
		onActivated: { addListener: vi.fn() },
		onUpdated: { addListener: vi.fn() },
		onRemoved: { addListener: vi.fn() },
		get: vi.fn(),
	},
	idle: {
		setDetectionInterval: vi.fn(),
		onStateChanged: { addListener: vi.fn() },
	},
	history: {
		search: vi.fn().mockResolvedValue([]),
	},
	alarms: {
		create: vi.fn(),
		onAlarm: {
			addListener: vi.fn(),
			removeListener: vi.fn(),
		},
	},
};

vi.stubGlobal("chrome", chromeMock);
