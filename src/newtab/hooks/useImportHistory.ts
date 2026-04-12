import { useEffect, useState } from "react";
import type { ImportProgressMessage } from "../../shared/types";

interface ImportState {
	importing: boolean;
	current: number;
	total: number;
	done: boolean;
}

export const useImportHistory = () => {
	const [state, setState] = useState<ImportState>({
		importing: false,
		current: 0,
		total: 0,
		done: false,
	});

	useEffect(() => {
		const handler = (message: ImportProgressMessage) => {
			if (message.type === "IMPORT_PROGRESS") {
				setState({
					importing: true,
					current: message.current,
					total: message.total,
					done: message.done,
				});
			}
		};
		chrome.runtime.onMessage.addListener(handler);
		return () => chrome.runtime.onMessage.removeListener(handler);
	}, []);

	return state;
};
