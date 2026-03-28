import { render, screen } from "@testing-library/react";
import { EmptyState } from "./EmptyState";

vi.mock("../hooks/useImportHistory", () => ({
	useImportHistory: vi.fn(),
}));

import { useImportHistory } from "../hooks/useImportHistory";

const mockUseImportHistory = vi.mocked(useImportHistory);

describe("EmptyState", () => {
	it('shows "No history yet" when not importing', () => {
		mockUseImportHistory.mockReturnValue({
			importing: false,
			current: 0,
			total: 0,
			done: false,
		});

		render(<EmptyState />);
		expect(screen.getByText("No history yet")).toBeInTheDocument();
		expect(
			screen.getByText(/Your browsing history will appear here/),
		).toBeInTheDocument();
	});

	it("shows import progress when importing", () => {
		mockUseImportHistory.mockReturnValue({
			importing: true,
			current: 250,
			total: 1000,
			done: false,
		});

		render(<EmptyState />);
		expect(
			screen.getByText("Importing your history..."),
		).toBeInTheDocument();
		expect(screen.getByText(/250/)).toBeInTheDocument();
		expect(screen.getByText(/1,000/)).toBeInTheDocument();
	});

	it('shows "No history yet" when import is done', () => {
		mockUseImportHistory.mockReturnValue({
			importing: true,
			current: 1000,
			total: 1000,
			done: true,
		});

		render(<EmptyState />);
		expect(screen.getByText("No history yet")).toBeInTheDocument();
	});
});
