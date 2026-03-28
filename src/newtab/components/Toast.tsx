import { useState, useEffect, useCallback, createContext, useContext } from "react";

interface Toast {
	id: number;
	message: string;
	type: "success" | "error" | "info";
}

interface ToastContextValue {
	toast: (message: string, type?: Toast["type"]) => void;
}

const ToastContext = createContext<ToastContextValue>({
	toast: () => {},
});

export const useToast = () => useContext(ToastContext);

let nextId = 0;

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
	const [toasts, setToasts] = useState<Toast[]>([]);

	const toast = useCallback((message: string, type: Toast["type"] = "success") => {
		const id = nextId++;
		setToasts((prev) => [...prev, { id, message, type }]);
	}, []);

	const dismiss = useCallback((id: number) => {
		setToasts((prev) => prev.filter((t) => t.id !== id));
	}, []);

	return (
		<ToastContext.Provider value={{ toast }}>
			{children}
			<div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
				{toasts.map((t) => (
					<ToastItem key={t.id} toast={t} onDismiss={dismiss} />
				))}
			</div>
		</ToastContext.Provider>
	);
};

const iconPaths: Record<Toast["type"], string> = {
	success: "M5 13l4 4L19 7",
	error: "M6 18L18 6M6 6l12 12",
	info: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
};

const colors: Record<Toast["type"], string> = {
	success: "text-moss-500",
	error: "text-coral-500",
	info: "text-honey-500",
};

const ToastItem = ({
	toast,
	onDismiss,
}: {
	toast: Toast;
	onDismiss: (id: number) => void;
}) => {
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		requestAnimationFrame(() => setVisible(true));
		const timer = setTimeout(() => {
			setVisible(false);
			setTimeout(() => onDismiss(toast.id), 200);
		}, 2500);
		return () => clearTimeout(timer);
	}, [toast.id, onDismiss]);

	return (
		<div
			className={`pointer-events-auto flex items-center gap-2.5 px-4 py-3 bg-white dark:bg-sand-800 rounded-lg shadow-lg shadow-sand-900/5 dark:shadow-black/20 border border-sand-200 dark:border-sand-700 text-[13px] text-sand-700 dark:text-sand-200 transition-all duration-200 ${
				visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
			}`}
			role="alert"
		>
			<svg
				className={`w-4 h-4 flex-shrink-0 ${colors[toast.type]}`}
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={2}
					d={iconPaths[toast.type]}
				/>
			</svg>
			<span>{toast.message}</span>
		</div>
	);
};
