import { useState, useEffect, useRef } from "react";
import { SEARCH_DEBOUNCE_MS } from "../../shared/constants";

interface SearchBarProps {
	value: string;
	onChange: (value: string) => void;
}

export const SearchBar = ({ value, onChange }: SearchBarProps) => {
	const [local, setLocal] = useState(value);
	const [focused, setFocused] = useState(false);
	const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		timerRef.current = setTimeout(() => onChange(local), SEARCH_DEBOUNCE_MS);
		return () => clearTimeout(timerRef.current);
	}, [local, onChange]);

	useEffect(() => {
		inputRef.current?.focus();

		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key === "k") {
				e.preventDefault();
				inputRef.current?.focus();
				inputRef.current?.select();
			}
			if (e.key === "Escape" && document.activeElement === inputRef.current) {
				inputRef.current?.blur();
			}
		};
		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, []);

	return (
		<div className={`relative group transition-all duration-300 ${focused ? "scale-[1.005]" : ""}`}>
			<svg
				className={`absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] transition-colors duration-200 ${
					focused ? "text-honey-500" : "text-sand-400"
				}`}
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={2}
					d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
				/>
			</svg>
			<input
				ref={inputRef}
				type="text"
				value={local}
				onChange={(e) => setLocal(e.target.value)}
				onFocus={() => setFocused(true)}
				onBlur={() => setFocused(false)}
				placeholder="Search by content, title, or URL..."
				className="w-full pl-11 pr-24 py-3.5 bg-white dark:bg-sand-850 border border-sand-200 dark:border-sand-700 rounded-xl text-[14px] text-sand-900 dark:text-sand-100 placeholder:text-sand-400 dark:placeholder:text-sand-600 focus:outline-none focus:border-honey-300 dark:focus:border-honey-700 focus:shadow-[0_0_0_3px_rgba(196,160,60,0.08)] dark:focus:shadow-[0_0_0_3px_rgba(196,160,60,0.05)] transition-all duration-200"
			/>
			<div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-2">
				{local ? (
					<button
						onClick={() => {
							setLocal("");
							onChange("");
							inputRef.current?.focus();
						}}
						className="text-sand-400 hover:text-sand-600 dark:hover:text-sand-300 p-0.5 transition-colors"
					>
						<svg
							className="w-4 h-4"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				) : (
					<kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-1 text-[10px] text-sand-400 bg-sand-100 dark:bg-sand-800 rounded-md border border-sand-200 dark:border-sand-700 font-mono tracking-wide">
						⌘K
					</kbd>
				)}
			</div>
		</div>
	);
};
