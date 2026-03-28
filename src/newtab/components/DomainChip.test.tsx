import { render, screen, fireEvent } from "@testing-library/react";
import { DomainChip } from "./DomainChip";

describe("DomainChip", () => {
	it("renders domain text", () => {
		render(
			<DomainChip domain="github.com" active={false} onClick={vi.fn()} />,
		);
		expect(screen.getByText("github.com")).toBeInTheDocument();
	});

	it("calls onClick when clicked", () => {
		const onClick = vi.fn();
		render(
			<DomainChip domain="github.com" active={false} onClick={onClick} />,
		);
		fireEvent.click(screen.getByText("github.com"));
		expect(onClick).toHaveBeenCalledOnce();
	});

	it("shows active styling when active=true", () => {
		const { rerender } = render(
			<DomainChip domain="github.com" active={false} onClick={vi.fn()} />,
		);
		const button = screen.getByRole("button");
		expect(button.className).toContain("bg-sand-100");

		rerender(
			<DomainChip domain="github.com" active={true} onClick={vi.fn()} />,
		);
		expect(button.className).toContain("bg-honey-100");
	});

	it("shows remove button when active and onRemove provided", () => {
		render(
			<DomainChip
				domain="github.com"
				active={true}
				onClick={vi.fn()}
				onRemove={vi.fn()}
			/>,
		);
		expect(screen.getByText("\u00d7")).toBeInTheDocument();
	});

	it("does not show remove button when not active", () => {
		render(
			<DomainChip
				domain="github.com"
				active={false}
				onClick={vi.fn()}
				onRemove={vi.fn()}
			/>,
		);
		expect(screen.queryByText("\u00d7")).not.toBeInTheDocument();
	});

	it("remove click calls onRemove and doesn't bubble", () => {
		const onClick = vi.fn();
		const onRemove = vi.fn();
		render(
			<DomainChip
				domain="github.com"
				active={true}
				onClick={onClick}
				onRemove={onRemove}
			/>,
		);

		const removeBtn = screen.getByText("\u00d7");
		fireEvent.click(removeBtn);

		expect(onRemove).toHaveBeenCalledOnce();
		// onClick should not fire because stopPropagation is called
		expect(onClick).not.toHaveBeenCalled();
	});
});
