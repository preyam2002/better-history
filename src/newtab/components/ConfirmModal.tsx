import { useEffect, useRef } from "react";

interface ConfirmModalProps {
	open: boolean;
	title: string;
	description: string;
	confirmLabel?: string;
	cancelLabel?: string;
	destructive?: boolean;
	onConfirm: () => void;
	onCancel: () => void;
}

export const ConfirmModal = ({
	open,
	title,
	description,
	confirmLabel = "Confirm",
	cancelLabel = "Cancel",
	destructive = false,
	onConfirm,
	onCancel,
}: ConfirmModalProps) => {
	const cancelRef = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		if (open) {
			cancelRef.current?.focus();
			const handler = (e: KeyboardEvent) => {
				if (e.key === "Escape") onCancel();
			};
			document.addEventListener("keydown", handler);
			return () => document.removeEventListener("keydown", handler);
		}
	}, [open, onCancel]);

	if (!open) return null;

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center p-4"
			role="dialog"
			aria-modal="true"
			aria-labelledby="modal-title"
		>
			<div
				className="absolute inset-0 bg-sand-900/30 dark:bg-black/50 backdrop-blur-sm fade-in"
				onClick={onCancel}
			/>
			<div className="relative bg-white dark:bg-sand-850 rounded-2xl shadow-2xl shadow-sand-900/10 dark:shadow-black/30 border border-sand-200 dark:border-sand-700 p-6 max-w-sm w-full zoom-in-95">
				<div
					className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${
						destructive
							? "bg-coral-50 dark:bg-coral-500/10"
							: "bg-honey-50 dark:bg-honey-900/20"
					}`}
				>
					<svg
						className={`w-5 h-5 ${destructive ? "text-coral-500" : "text-honey-500"}`}
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d={
								destructive
									? "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
									: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							}
						/>
					</svg>
				</div>
				<h2
					id="modal-title"
					className="text-[15px] font-semibold text-sand-900 dark:text-sand-100 mb-1"
				>
					{title}
				</h2>
				<p className="text-[13px] text-sand-500 dark:text-sand-400 mb-6 leading-relaxed">
					{description}
				</p>
				<div className="flex gap-2">
					<button
						type="button"
						ref={cancelRef}
						onClick={onCancel}
						className="flex-1 px-4 py-2.5 text-[13px] bg-sand-100 dark:bg-sand-800 text-sand-600 dark:text-sand-300 rounded-lg hover:bg-sand-200 dark:hover:bg-sand-700 transition-colors font-medium"
					>
						{cancelLabel}
					</button>
					<button
						type="button"
						onClick={onConfirm}
						className={`flex-1 px-4 py-2.5 text-[13px] rounded-lg font-medium transition-colors ${
							destructive
								? "bg-coral-500 text-white hover:bg-coral-600"
								: "bg-honey-500 text-white hover:bg-honey-600"
						}`}
					>
						{confirmLabel}
					</button>
				</div>
			</div>
		</div>
	);
};
