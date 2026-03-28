import { render, screen, fireEvent } from "@testing-library/react";
import { DateRangePicker } from "./DateRangePicker";

describe("DateRangePicker", () => {
	it("renders all preset buttons", () => {
		render(<DateRangePicker value={null} onChange={vi.fn()} />);
		expect(screen.getByText("All time")).toBeInTheDocument();
		expect(screen.getByText("Today")).toBeInTheDocument();
		expect(screen.getByText("Yesterday")).toBeInTheDocument();
		expect(screen.getByText("Last 7 days")).toBeInTheDocument();
		expect(screen.getByText("Last 30 days")).toBeInTheDocument();
		expect(screen.getByText("Last 90 days")).toBeInTheDocument();
	});

	it('"All time" calls onChange with null', () => {
		const onChange = vi.fn();
		render(<DateRangePicker value={null} onChange={onChange} />);
		fireEvent.click(screen.getByText("All time"));
		expect(onChange).toHaveBeenCalledWith(null);
	});

	it('"Today" calls onChange with correct start/end timestamps', () => {
		vi.useFakeTimers();
		const now = Date.now();
		const onChange = vi.fn();
		render(<DateRangePicker value={null} onChange={onChange} />);

		fireEvent.click(screen.getByText("Today"));

		expect(onChange).toHaveBeenCalledOnce();
		const range = onChange.mock.calls[0]![0] as {
			start: number;
			end: number;
		};
		expect(range).not.toBeNull();
		// end should be now (frozen)
		expect(range.end).toBe(now);
		// start should be 24h before end
		const oneDayMs = 24 * 60 * 60 * 1000;
		expect(range.end - range.start).toBe(oneDayMs);
		vi.useRealTimers();
	});

	it("active preset has highlighted styling", () => {
		render(<DateRangePicker value={null} onChange={vi.fn()} />);
		const allTimeBtn = screen.getByText("All time");
		expect(allTimeBtn.className).toContain("bg-honey-100");

		const todayBtn = screen.getByText("Today");
		expect(todayBtn.className).not.toContain("bg-honey-100");
	});

	it("non-null value highlights the matching preset", () => {
		const now = Date.now();
		const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
		const value = { start: now - sevenDaysMs, end: now };

		render(<DateRangePicker value={value} onChange={vi.fn()} />);

		const last7Btn = screen.getByText("Last 7 days");
		expect(last7Btn.className).toContain("bg-honey-100");

		const allTimeBtn = screen.getByText("All time");
		expect(allTimeBtn.className).not.toContain("bg-honey-100");
	});
});
