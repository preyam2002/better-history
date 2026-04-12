interface DomainChipProps {
	domain: string;
	active: boolean;
	onClick: () => void;
	onRemove?: () => void;
}

export const DomainChip = ({
	domain,
	active,
	onClick,
	onRemove,
}: DomainChipProps) => (
	<button
		type="button"
		onClick={onClick}
		className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all duration-200 ${
			active
				? "bg-honey-100 text-honey-800 dark:bg-honey-900/30 dark:text-honey-300 ring-1 ring-honey-200 dark:ring-honey-800/50"
				: "bg-sand-100 text-sand-500 hover:bg-sand-200 dark:bg-sand-800 dark:text-sand-400 dark:hover:bg-sand-700"
		}`}
	>
		{domain}
		{active && onRemove && (
			<button
				type="button"
				onClick={(e) => {
					e.stopPropagation();
					onRemove();
				}}
				aria-label={`Remove ${domain}`}
				className="ml-0.5 hover:text-honey-900 dark:hover:text-honey-100 cursor-pointer bg-transparent border-none p-0"
			>
				×
			</button>
		)}
	</button>
);
