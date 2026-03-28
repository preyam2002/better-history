import { render, screen, fireEvent } from "@testing-library/react";
import { SearchBar } from "./SearchBar";

describe("SearchBar", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("renders search input with placeholder", () => {
		render(<SearchBar value="" onChange={vi.fn()} />);
		expect(
			screen.getByPlaceholderText(
				"Search by content, title, or URL...",
			),
		).toBeInTheDocument();
	});

	it("input updates on typing", async () => {
		render(<SearchBar value="" onChange={vi.fn()} />);
		const input = screen.getByPlaceholderText(
			"Search by content, title, or URL...",
		);
		fireEvent.change(input, { target: { value: "react" } });
		expect(input).toHaveValue("react");
	});

	it("onChange called after debounce", () => {
		const onChange = vi.fn();
		render(<SearchBar value="" onChange={onChange} />);
		const input = screen.getByPlaceholderText(
			"Search by content, title, or URL...",
		);

		fireEvent.change(input, { target: { value: "hooks" } });
		// Not called yet (debounce pending)
		expect(onChange).not.toHaveBeenCalledWith("hooks");

		vi.advanceTimersByTime(300);
		expect(onChange).toHaveBeenCalledWith("hooks");
	});

	it("clear button appears when text entered", () => {
		render(<SearchBar value="" onChange={vi.fn()} />);
		const input = screen.getByPlaceholderText(
			"Search by content, title, or URL...",
		);

		// No clear button initially
		expect(screen.queryByRole("button")).not.toBeInTheDocument();

		fireEvent.change(input, { target: { value: "test" } });
		expect(screen.getByRole("button")).toBeInTheDocument();
	});

	it("clear button resets input and calls onChange with empty string", () => {
		const onChange = vi.fn();
		render(<SearchBar value="" onChange={onChange} />);
		const input = screen.getByPlaceholderText(
			"Search by content, title, or URL...",
		);

		fireEvent.change(input, { target: { value: "query" } });
		const clearBtn = screen.getByRole("button");
		fireEvent.click(clearBtn);

		expect(input).toHaveValue("");
		expect(onChange).toHaveBeenCalledWith("");
	});

	it("Escape key blurs input", () => {
		render(<SearchBar value="" onChange={vi.fn()} />);
		const input = screen.getByPlaceholderText(
			"Search by content, title, or URL...",
		);

		input.focus();
		expect(document.activeElement).toBe(input);

		fireEvent.keyDown(document, { key: "Escape" });
		expect(document.activeElement).not.toBe(input);
	});

	it("Cmd+K focuses input", () => {
		render(<SearchBar value="" onChange={vi.fn()} />);
		const input = screen.getByPlaceholderText(
			"Search by content, title, or URL...",
		);

		// Blur it first (it auto-focuses on mount)
		input.blur();
		expect(document.activeElement).not.toBe(input);

		fireEvent.keyDown(document, { key: "k", metaKey: true });
		expect(document.activeElement).toBe(input);
	});
});
