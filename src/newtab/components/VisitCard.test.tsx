import { fireEvent, render, screen } from "@testing-library/react";
import type { Visit } from "../../shared/types";

vi.mock("../../shared/db", () => ({
	db: {
		visits: {
			delete: vi.fn().mockResolvedValue(undefined),
		},
	},
}));

vi.mock("../lib/search", () => ({
	extractSnippet: vi.fn().mockReturnValue(null),
}));

vi.mock("./Toast", () => ({
	useToast: () => ({ toast: vi.fn() }),
}));

// eslint-disable-next-line -- must import after mocks
import { VisitCard } from "./VisitCard";

const makeVisit = (overrides: Partial<Visit> = {}): Visit => ({
	id: 1,
	url: "https://github.com/facebook/react",
	title: "React - A JavaScript library",
	domain: "github.com",
	timestamp: Date.now() - 60_000,
	duration: 120,
	scrollDepth: 45,
	...overrides,
});

describe("VisitCard", () => {
	it("renders visit title and domain", () => {
		render(<VisitCard visit={makeVisit()} />);
		expect(
			screen.getByText("React - A JavaScript library"),
		).toBeInTheDocument();
		expect(screen.getByText("github.com")).toBeInTheDocument();
	});

	it("shows duration badge when duration > 0", () => {
		render(<VisitCard visit={makeVisit({ duration: 120 })} />);
		expect(screen.getByText("2m")).toBeInTheDocument();
	});

	it("shows scroll depth when > 0", () => {
		render(<VisitCard visit={makeVisit({ scrollDepth: 45 })} />);
		expect(screen.getByText("45%")).toBeInTheDocument();
	});

	it("hides duration badge when duration is 0", () => {
		render(<VisitCard visit={makeVisit({ duration: 0 })} />);
		expect(screen.queryByText("0s")).not.toBeInTheDocument();
	});

	it("hides scroll depth badge when scrollDepth is 0", () => {
		render(<VisitCard visit={makeVisit({ scrollDepth: 0 })} />);
		expect(screen.queryByText("0%")).not.toBeInTheDocument();
	});

	it("delete button calls db.visits.delete", async () => {
		const { db } = await import("../../shared/db");
		render(<VisitCard visit={makeVisit({ id: 42 })} />);

		const deleteBtn = screen.getByTitle("Remove from history");
		fireEvent.click(deleteBtn);

		expect(db.visits.delete).toHaveBeenCalledWith(42);
	});

	it("copy button copies URL to clipboard", () => {
		const writeText = vi.fn().mockResolvedValue(undefined);
		Object.assign(navigator, {
			clipboard: { writeText },
		});

		render(<VisitCard visit={makeVisit()} />);

		const copyBtn = screen.getByTitle("Copy URL");
		fireEvent.click(copyBtn);

		expect(writeText).toHaveBeenCalledWith("https://github.com/facebook/react");
	});

	it("link href matches visit URL", () => {
		render(<VisitCard visit={makeVisit()} />);
		const link = screen.getByRole("link");
		expect(link).toHaveAttribute("href", "https://github.com/facebook/react");
	});

	it("falls back to URL when title is empty", () => {
		render(<VisitCard visit={makeVisit({ title: "" })} />);
		expect(
			screen.getByText("https://github.com/facebook/react"),
		).toBeInTheDocument();
	});
});
